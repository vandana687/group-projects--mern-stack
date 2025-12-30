const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// @route   POST /api/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/', auth, [
  body('task').notEmpty().withMessage('Task ID is required'),
  body('content').trim().notEmpty().withMessage('Comment content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { task, content, parentComment, mentions } = req.body;

    // Verify task exists
    const taskDoc = await Task.findById(task);
    if (!taskDoc) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = new Comment({
      task,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
      mentions: mentions || []
    });

    await comment.save();

    // Create activity
    await Activity.create({
      project: taskDoc.project,
      user: req.user._id,
      action: 'comment_added',
      entity: {
        entityType: 'Comment',
        entityId: comment._id
      },
      details: {
        taskId: task,
        taskTitle: taskDoc.title
      }
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    io.emitToProject(taskDoc.project.toString(), 'comment_added', {
      comment: populatedComment,
      taskId: task,
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

// @route   GET /api/comments/task/:taskId
// @desc    Get all comments for a task
// @access  Private
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email')
      .populate('parentComment')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

// @route   PUT /api/comments/:commentId
// @desc    Update a comment
// @access  Private (Author only)
router.put('/:commentId', auth, [
  body('content').trim().notEmpty().withMessage('Comment content is required')
], async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only author can update
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.content = req.body.content;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment
// @access  Private (Author only)
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only author can delete
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
});

module.exports = router;
