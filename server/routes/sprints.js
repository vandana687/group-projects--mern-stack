const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { checkProjectPermission } = require('../middleware/permissions');

// @route   POST /api/sprints
// @desc    Create a new sprint
// @access  Private (Project Manager+)
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Sprint name is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, project, startDate, endDate, goal } = req.body;

    const sprint = new Sprint({
      name,
      project,
      startDate,
      endDate,
      goal
    });

    await sprint.save();

    // Create activity
    await Activity.create({
      project,
      user: req.user._id,
      action: 'sprint_created',
      entity: {
        entityType: 'Sprint',
        entityId: sprint._id
      },
      details: {
        sprintName: name
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(project, 'sprint_updated', {
      sprint,
      action: 'created',
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sprint created successfully',
      sprint
    });
  } catch (error) {
    console.error('Create sprint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sprint'
    });
  }
});

// @route   GET /api/sprints/project/:projectId
// @desc    Get all sprints for a project
// @access  Private
router.get('/project/:projectId', auth, checkProjectPermission(), async (req, res) => {
  try {
    const sprints = await Sprint.find({ project: req.params.projectId })
      .sort({ startDate: -1 });

    // Update sprint statuses
    for (let sprint of sprints) {
      sprint.updateStatus();
      await sprint.save();
    }

    res.json({
      success: true,
      sprints
    });
  } catch (error) {
    console.error('Get sprints error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sprints'
    });
  }
});

// @route   GET /api/sprints/:sprintId
// @desc    Get sprint by ID with tasks
// @access  Private
router.get('/:sprintId', auth, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.sprintId);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    // Update sprint status
    sprint.updateStatus();
    await sprint.save();

    // Get sprint tasks
    const tasks = await Task.find({ sprint: sprint._id })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort({ order: 1 });

    res.json({
      success: true,
      sprint,
      tasks
    });
  } catch (error) {
    console.error('Get sprint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sprint'
    });
  }
});

// @route   PUT /api/sprints/:sprintId
// @desc    Update sprint
// @access  Private (Project Manager+)
router.put('/:sprintId', auth, [
  body('name').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('status').optional().isIn(['Planning', 'Active', 'Completed', 'Cancelled'])
], async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.sprintId);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    const { name, startDate, endDate, goal, status } = req.body;

    if (name) sprint.name = name;
    if (startDate) sprint.startDate = startDate;
    if (endDate) sprint.endDate = endDate;
    if (goal !== undefined) sprint.goal = goal;
    if (status) sprint.status = status;

    await sprint.save();

    // Create activity
    await Activity.create({
      project: sprint.project,
      user: req.user._id,
      action: 'sprint_updated',
      entity: {
        entityType: 'Sprint',
        entityId: sprint._id
      },
      details: {
        sprintName: sprint.name
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(sprint.project.toString(), 'sprint_updated', {
      sprint,
      action: 'updated',
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Sprint updated successfully',
      sprint
    });
  } catch (error) {
    console.error('Update sprint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sprint'
    });
  }
});

// @route   GET /api/sprints/:sprintId/burndown
// @desc    Get burndown chart data for sprint
// @access  Private
router.get('/:sprintId/burndown', auth, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.sprintId);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    const tasks = await Task.find({ sprint: sprint._id });

    // Calculate total estimated hours
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

    // Get task completion data per day
    const TimeLog = require('../models/TimeLog');
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const days = [];

    let currentDate = new Date(startDate);
    let remainingWork = totalEstimatedHours;

    while (currentDate <= endDate) {
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Count completed tasks up to this day
      const completedTasks = tasks.filter(task => 
        task.status === 'done' && 
        new Date(task.updatedAt) <= dayEnd
      );

      const completedHours = completedTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
      remainingWork = totalEstimatedHours - completedHours;

      days.push({
        date: new Date(currentDate),
        remainingWork: Math.max(0, remainingWork),
        completedWork: completedHours,
        idealRemaining: totalEstimatedHours * (1 - (currentDate - startDate) / (endDate - startDate))
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      burndown: {
        totalEstimatedHours,
        days,
        sprint: {
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate
        }
      }
    });
  } catch (error) {
    console.error('Get burndown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating burndown chart'
    });
  }
});

// @route   DELETE /api/sprints/:sprintId
// @desc    Delete sprint
// @access  Private (Project Manager+)
router.delete('/:sprintId', auth, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.sprintId);

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    // Remove sprint reference from tasks
    await Task.updateMany(
      { sprint: sprint._id },
      { $set: { sprint: null } }
    );

    await Sprint.findByIdAndDelete(req.params.sprintId);

    res.json({
      success: true,
      message: 'Sprint deleted successfully'
    });
  } catch (error) {
    console.error('Delete sprint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sprint'
    });
  }
});

module.exports = router;
