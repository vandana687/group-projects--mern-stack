const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { checkProjectPermission } = require('../middleware/permissions');

// @route   GET /api/activity/project/:projectId
// @desc    Get activity feed for a project
// @access  Private
router.get('/project/:projectId', auth, checkProjectPermission(), async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const activities = await Activity.find({ project: req.params.projectId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Activity.countDocuments({ project: req.params.projectId });

    res.json({
      success: true,
      activities,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + activities.length)
      }
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity feed'
    });
  }
});

// @route   GET /api/activity/user
// @desc    Get activity feed for current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const activities = await Activity.find({ user: req.user._id })
      .populate('user', 'name email avatar')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Activity.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      activities,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + activities.length)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity'
    });
  }
});

module.exports = router;
