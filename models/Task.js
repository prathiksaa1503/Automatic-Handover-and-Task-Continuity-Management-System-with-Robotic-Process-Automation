const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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
  backupOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'on-hold'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isRisk: {
    type: Boolean,
    default: false
  },
  riskReason: {
    type: String,
    trim: true
  },
  handoverNotes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HandoverNote',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ backupOwner: 1 });
taskSchema.index({ isRisk: 1 });

module.exports = mongoose.model('Task', taskSchema);
