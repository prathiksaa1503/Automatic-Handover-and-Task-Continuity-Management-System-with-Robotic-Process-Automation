const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'unavailable', 'on-leave', 'sick-leave', 'vacation'],
    default: 'available'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  reason: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    email: String,
    phone: String
  },
  autoReminderEnabled: {
    type: Boolean,
    default: true
  },
  lastReminderSent: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
availabilitySchema.index({ user: 1 });
availabilitySchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
