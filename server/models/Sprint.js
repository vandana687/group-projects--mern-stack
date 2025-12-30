const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  goal: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'Completed', 'Cancelled'],
    default: 'Planning'
  }
}, {
  timestamps: true
});

// Validation: endDate must be after startDate
sprintSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Auto-update sprint status based on dates
sprintSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.status === 'Cancelled') {
    return;
  }
  
  if (now < this.startDate) {
    this.status = 'Planning';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'Active';
  } else if (now > this.endDate) {
    this.status = 'Completed';
  }
};

module.exports = mongoose.model('Sprint', sprintSchema);
