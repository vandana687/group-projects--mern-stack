const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// @route   POST /api/time-logs/start
// @desc    Start a timer for a task
// @access  Private
router.post('/start', auth, [
  body('task').notEmpty().withMessage('Task ID is required')
], async (req, res) => {
  try {
    const { task, description } = req.body;

    // Check if user already has a running timer
    const runningTimer = await TimeLog.findOne({
      user: req.user._id,
      isRunning: true
    });

    if (runningTimer) {
      return res.status(400).json({
        success: false,
        message: 'You already have a running timer. Please stop it first.'
      });
    }

    // Verify task exists
    const taskDoc = await Task.findById(task);
    if (!taskDoc) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const timeLog = new TimeLog({
      task,
      user: req.user._id,
      startTime: new Date(),
      description,
      isRunning: true
    });

    await timeLog.save();

    const populatedTimeLog = await TimeLog.findById(timeLog._id)
      .populate('task', 'title')
      .populate('user', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(taskDoc.project.toString(), 'timer_started', {
      taskId: task,
      timeLog: populatedTimeLog,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      timeLog: populatedTimeLog
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting timer'
    });
  }
});

// @route   PUT /api/time-logs/:timeLogId/stop
// @desc    Stop a running timer
// @access  Private
router.put('/:timeLogId/stop', auth, async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.timeLogId)
      .populate('task');

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found'
      });
    }

    // Only the owner can stop their timer
    if (timeLog.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only stop your own timer'
      });
    }

    if (!timeLog.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Timer is not running'
      });
    }

    timeLog.endTime = new Date();
    timeLog.isRunning = false;

    await timeLog.save();

    const populatedTimeLog = await TimeLog.findById(timeLog._id)
      .populate('task', 'title')
      .populate('user', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    const taskDoc = await Task.findById(timeLog.task._id);
    io.emitToProject(taskDoc.project.toString(), 'timer_stopped', {
      taskId: timeLog.task._id,
      timeLog: populatedTimeLog,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      timeLog: populatedTimeLog
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping timer'
    });
  }
});

// @route   POST /api/time-logs/manual
// @desc    Add manual time entry
// @access  Private
router.post('/manual', auth, [
  body('task').notEmpty().withMessage('Task ID is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { task, startTime, endTime, description } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const timeLog = new TimeLog({
      task,
      user: req.user._id,
      startTime: start,
      endTime: end,
      description,
      isRunning: false
    });

    await timeLog.save();

    const populatedTimeLog = await TimeLog.findById(timeLog._id)
      .populate('task', 'title')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Time entry added successfully',
      timeLog: populatedTimeLog
    });
  } catch (error) {
    console.error('Add time log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding time entry'
    });
  }
});

// @route   GET /api/time-logs/task/:taskId
// @desc    Get all time logs for a task
// @access  Private
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const timeLogs = await TimeLog.find({ task: req.params.taskId })
      .populate('user', 'name email avatar')
      .sort({ startTime: -1 });

    const totalDuration = timeLogs.reduce((sum, log) => sum + log.duration, 0);

    res.json({
      success: true,
      timeLogs,
      totalDuration,
      totalHours: totalDuration.toFixed(2)
    });
  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time logs'
    });
  }
});

// @route   GET /api/time-logs/user/current
// @desc    Get current user's running timer
// @access  Private
router.get('/user/current', auth, async (req, res) => {
  try {
    const runningTimer = await TimeLog.findOne({
      user: req.user._id,
      isRunning: true
    })
    .populate('task', 'title project')
    .populate('user', 'name email');

    res.json({
      success: true,
      timeLog: runningTimer
    });
  } catch (error) {
    console.error('Get running timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching running timer'
    });
  }
});

// @route   GET /api/time-logs/sprint/:sprintId
// @desc    Get time logs for a sprint
// @access  Private
router.get('/sprint/:sprintId', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find({ sprint: req.params.sprintId }).select('_id');
    const taskIds = tasks.map(t => t._id);

    const timeLogs = await TimeLog.find({ task: { $in: taskIds } })
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .sort({ startTime: -1 });

    const totalDuration = timeLogs.reduce((sum, log) => sum + log.duration, 0);

    // Group by user
    const byUser = {};
    timeLogs.forEach(log => {
      const userId = log.user._id.toString();
      if (!byUser[userId]) {
        byUser[userId] = {
          user: log.user,
          duration: 0,
          logs: []
        };
      }
      byUser[userId].duration += log.duration;
      byUser[userId].logs.push(log);
    });

    res.json({
      success: true,
      timeLogs,
      totalDuration,
      totalHours: totalDuration.toFixed(2),
      byUser: Object.values(byUser)
    });
  } catch (error) {
    console.error('Get sprint time logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sprint time logs'
    });
  }
});

// @route   DELETE /api/time-logs/:timeLogId
// @desc    Delete a time log
// @access  Private (Owner only)
router.delete('/:timeLogId', auth, async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.timeLogId);

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found'
      });
    }

    // Only owner can delete
    if (timeLog.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own time logs'
      });
    }

    await TimeLog.findByIdAndDelete(req.params.timeLogId);

    res.json({
      success: true,
      message: 'Time log deleted successfully'
    });
  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting time log'
    });
  }
});

module.exports = router;
