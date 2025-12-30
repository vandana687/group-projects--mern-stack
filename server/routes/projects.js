const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { checkProjectPermission } = require('../middleware/permissions');

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    const project = new Project({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'Admin'
      }]
    });

    await project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(req.user._id, {
      $push: { projects: project._id }
    });

    // Create activity
    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'project_created',
      entity: {
        entityType: 'Project',
        entityId: project._id
      }
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
});

// @route   GET /api/projects
// @desc    Get all user's projects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ],
      isActive: true
    })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
});

// @route   GET /api/projects/:projectId
// @desc    Get project by ID
// @access  Private
router.get('/:projectId', auth, checkProjectPermission(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role');

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
});

// @route   PUT /api/projects/:projectId
// @desc    Update project
// @access  Private (Admin/Project Manager)
router.put('/:projectId', auth, checkProjectPermission('Project Manager'), [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
});

// @route   POST /api/projects/:projectId/members
// @desc    Add member to project
// @access  Private (Admin/Project Manager)
router.post('/:projectId/members', auth, checkProjectPermission('Project Manager'), [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').optional().isIn(['Admin', 'Project Manager', 'Team Member'])
], async (req, res) => {
  try {
    const { userId, role } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    const isMember = req.project.members.some(
      m => m.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    req.project.members.push({
      user: userId,
      role: role || 'Team Member'
    });

    await req.project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(userId, {
      $addToSet: { projects: req.project._id }
    });

    // Create activity
    await Activity.create({
      project: req.project._id,
      user: req.user._id,
      action: 'member_added',
      entity: {
        entityType: 'Project',
        entityId: req.project._id
      },
      details: {
        addedUserId: userId,
        role: role || 'Team Member'
      }
    });

    const updatedProject = await Project.findById(req.project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(req.project._id.toString(), 'member_added', {
      project: updatedProject,
      newMember: user
    });

    res.json({
      success: true,
      message: 'Member added successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member'
    });
  }
});

// @route   DELETE /api/projects/:projectId/members/:userId
// @desc    Remove member from project
// @access  Private (Admin/Project Manager)
router.delete('/:projectId/members/:userId', auth, checkProjectPermission('Project Manager'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Cannot remove owner
    if (req.project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    // Remove member
    req.project.members = req.project.members.filter(
      m => m.user.toString() !== userId
    );

    await req.project.save();

    // Remove project from user's projects
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: req.project._id }
    });

    // Create activity
    await Activity.create({
      project: req.project._id,
      user: req.user._id,
      action: 'member_removed',
      entity: {
        entityType: 'Project',
        entityId: req.project._id
      },
      details: {
        removedUserId: userId
      }
    });

    const updatedProject = await Project.findById(req.project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(req.project._id.toString(), 'member_removed', {
      project: updatedProject,
      removedUserId: userId
    });

    res.json({
      success: true,
      message: 'Member removed successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
});

// @route   PUT /api/projects/:projectId/workflow
// @desc    Update project workflow
// @access  Private (Admin/Project Manager)
router.put('/:projectId/workflow', auth, checkProjectPermission('Project Manager'), [
  body('workflow').isArray().withMessage('Workflow must be an array'),
  body('workflow.*.name').notEmpty().withMessage('Stage name is required'),
  body('workflow.*.order').isInt().withMessage('Order must be a number')
], async (req, res) => {
  try {
    const { workflow } = req.body;

    req.project.workflow = workflow;
    await req.project.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(req.project._id.toString(), 'workflow_updated', {
      workflow: req.project.workflow
    });

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      workflow: req.project.workflow
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workflow'
    });
  }
});

// @route   DELETE /api/projects/:projectId
// @desc    Delete project (soft delete)
// @access  Private (Owner only)
router.delete('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project'
      });
    }

    project.isActive = false;
    await project.save();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
});

module.exports = router;
