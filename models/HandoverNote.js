const mongoose = require('mongoose');

const handoverNoteSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  knowledgeTransfer: {
    type: String,
    required: true,
    trim: true
  },
  keyContacts: [{
    name: String,
    email: String,
    role: String
  }],
  importantFiles: [{
    name: String,
    location: String,
    description: String
  }],
  accessCredentials: [{
    platform: String,
    username: String,
    notes: String
  }],
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'completed'],
    default: 'pending'
  },
  acknowledgedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
handoverNoteSchema.index({ task: 1 });
handoverNoteSchema.index({ fromUser: 1, status: 1 });
handoverNoteSchema.index({ toUser: 1, status: 1 });

module.exports = mongoose.model('HandoverNote', handoverNoteSchema);
