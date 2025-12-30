const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'project_created',
      'task_created',
      'task_updated',
      'task_moved',
      'task_deleted',
      'task_assigned',
      'comment_added',
      'file_uploaded',
      'sprint_created',
      'sprint_updated',
      'member_added',
      'member_removed'
    ]
  },
  entity: {
    entityType: {
      type: String,
      enum: ['Task', 'Sprint', 'Comment', 'Project'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
