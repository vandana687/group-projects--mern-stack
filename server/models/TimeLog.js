const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in hours
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  isRunning: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate duration before saving
timeLogSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    const durationInSeconds = (this.endTime - this.startTime) / 1000;
    this.duration = durationInSeconds / 3600; // Convert to hours
    this.isRunning = false;
  }
  next();
});

// Index for efficient querying
timeLogSchema.index({ task: 1, user: 1 });
timeLogSchema.index({ user: 1, startTime: -1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
