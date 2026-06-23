const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const { authenticateToken } = require('./auth');

// Get current user's availability
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let availability = await Availability.findOne({ user: req.user.userId })
      .populate('user', 'name email');

    if (!availability) {
      // Create default availability
      availability = new Availability({
        user: req.user.userId,
        status: 'available'
      });
      await availability.save();
      await availability.populate('user', 'name email');
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update availability
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      reason,
      emergencyContact,
      autoReminderEnabled
    } = req.body;

    let availability = await Availability.findOne({ user: req.user.userId });

    if (!availability) {
      availability = new Availability({
        user: req.user.userId,
        status: status || 'available'
      });
    }

    if (status) availability.status = status;
    if (startDate) availability.startDate = startDate;
    if (endDate) availability.endDate = endDate;
    if (reason !== undefined) availability.reason = reason;
    if (emergencyContact) availability.emergencyContact = emergencyContact;
    if (autoReminderEnabled !== undefined) availability.autoReminderEnabled = autoReminderEnabled;

    await availability.save();
    await availability.populate('user', 'name email');

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all availabilities (for managers/admins)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const availabilities = await Availability.find(query)
      .populate('user', 'name email role')
      .sort({ updatedAt: -1 });

    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get availability by user ID (for managers/admins)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const availability = await Availability.findOne({ user: req.params.userId })
      .populate('user', 'name email role');

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
