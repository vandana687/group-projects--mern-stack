const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Admin', 'Project Manager', 'Team Member'],
      default: 'Team Member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  workflow: [{
    id: String,
    name: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: '#6366f1'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Default workflow stages
projectSchema.pre('save', function(next) {
  if (this.isNew && this.workflow.length === 0) {
    this.workflow = [
      { id: 'todo', name: 'To Do', order: 1, color: '#94a3b8' },
      { id: 'inprogress', name: 'In Progress', order: 2, color: '#3b82f6' },
      { id: 'review', name: 'Review', order: 3, color: '#f59e0b' },
      { id: 'done', name: 'Done', order: 4, color: '#10b981' }
    ];
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
