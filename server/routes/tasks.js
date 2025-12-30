const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { checkProjectPermission } = require('../middleware/permissions');

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('status').optional().trim(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('assignee').optional(),
  body('dueDate').optional().isISO8601(),
  body('estimatedHours').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      project,
      status,
      priority,
      assignee,
      labels,
      dueDate,
      sprint,
      estimatedHours
    } = req.body;

    // Verify project access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is a member
    const isMember = projectDoc.owner.toString() === req.user._id.toString() ||
      projectDoc.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    // Get max order for the status
    const maxOrderTask = await Task.findOne({ project, status: status || 'todo' })
      .sort({ order: -1 });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = new Task({
      title,
      description,
      project,
      status: status || 'todo',
      priority: priority || 'Medium',
      assignee: assignee || null,
      reporter: req.user._id,
      labels: labels || [],
      dueDate: dueDate || null,
      sprint: sprint || null,
      estimatedHours: estimatedHours || 0,
      order
    });

    await task.save();

    // Create activity
    await Activity.create({
      project,
      user: req.user._id,
      action: 'task_created',
      entity: {
        entityType: 'Task',
        entityId: task._id
      },
      details: {
        taskTitle: title
      }
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(project, 'task_created', {
      task: populatedTask,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
});

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', auth, checkProjectPermission(), async (req, res) => {
  try {
    const { status, assignee, sprint, priority } = req.query;
    
    const filter = { project: req.params.projectId };
    
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (sprint) filter.sprint = sprint;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('sprint', 'name startDate endDate')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});

// @route   GET /api/tasks/:taskId
// @desc    Get task by ID
// @access  Private
router.get('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('sprint', 'name startDate endDate')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check project access
    const project = await Project.findById(task.project._id);
    const isMember = project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this task'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
});

// @route   PUT /api/tasks/:taskId
// @desc    Update task
// @access  Private
router.put('/:taskId', auth, [
  body('title').optional().trim().notEmpty(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('dueDate').optional().isISO8601().toDate(),
  body('estimatedHours').optional().isNumeric()
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const {
      title,
      description,
      priority,
      assignee,
      labels,
      dueDate,
      sprint,
      estimatedHours
    } = req.body;

    const changes = {};
    if (title !== undefined && title !== task.title) {
      changes.title = { old: task.title, new: title };
      task.title = title;
    }
    if (description !== undefined && description !== task.description) {
      changes.description = { old: task.description, new: description };
      task.description = description;
    }
    if (priority !== undefined && priority !== task.priority) {
      changes.priority = { old: task.priority, new: priority };
      task.priority = priority;
    }
    if (assignee !== undefined && assignee !== task.assignee?.toString()) {
      changes.assignee = { old: task.assignee, new: assignee };
      task.assignee = assignee || null;
    }
    if (labels !== undefined) {
      task.labels = labels;
    }
    if (dueDate !== undefined) {
      changes.dueDate = { old: task.dueDate, new: dueDate };
      task.dueDate = dueDate;
    }
    if (sprint !== undefined) {
      changes.sprint = { old: task.sprint, new: sprint };
      task.sprint = sprint || null;
    }
    if (estimatedHours !== undefined) {
      task.estimatedHours = estimatedHours;
    }

    await task.save();

    // Create activity
    if (Object.keys(changes).length > 0) {
      await Activity.create({
        project: task.project,
        user: req.user._id,
        action: 'task_updated',
        entity: {
          entityType: 'Task',
          entityId: task._id
        },
        details: {
          taskTitle: task.title,
          changes
        }
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('sprint', 'name startDate endDate');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(task.project.toString(), 'task_updated', {
      task: populatedTask,
      changes,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
});

// @route   PUT /api/tasks/:taskId/move
// @desc    Move task to different status (drag & drop)
// @access  Private
router.put('/:taskId/move', auth, [
  body('toStatus').notEmpty().withMessage('Target status is required'),
  body('newOrder').optional().isInt()
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const { toStatus, newOrder } = req.body;
    const fromStatus = task.status;

    if (fromStatus !== toStatus) {
      task.status = toStatus;
      
      // Create activity
      await Activity.create({
        project: task.project,
        user: req.user._id,
        action: 'task_moved',
        entity: {
          entityType: 'Task',
          entityId: task._id
        },
        details: {
          taskTitle: task.title,
          fromStatus,
          toStatus
        }
      });
    }

    if (newOrder !== undefined) {
      task.order = newOrder;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(task.project.toString(), 'task_moved', {
      task: populatedTask,
      fromStatus,
      toStatus,
      newOrder,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task moved successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moving task'
    });
  }
});

// @route   DELETE /api/tasks/:taskId
// @desc    Delete task
// @access  Private
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const projectId = task.project;
    const taskTitle = task.title;

    await Task.findByIdAndDelete(req.params.taskId);

    // Create activity
    await Activity.create({
      project: projectId,
      user: req.user._id,
      action: 'task_deleted',
      entity: {
        entityType: 'Task',
        entityId: task._id
      },
      details: {
        taskTitle
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(projectId.toString(), 'task_deleted', {
      taskId: task._id,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
});

module.exports = router;
