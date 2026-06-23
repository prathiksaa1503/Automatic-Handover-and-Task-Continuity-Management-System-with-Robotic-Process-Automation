const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');

// Get all tasks for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, isRisk } = req.query;
    const query = { owner: req.user.userId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (isRisk !== undefined) query.isRisk = isRisk === 'true';

    const tasks = await Task.find(query)
      .populate('owner', 'name email')
      .populate('backupOwner', 'name email')
      .populate('handoverNotes')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('backupOwner', 'name email')
      .populate('handoverNotes');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access
    if (task.owner._id.toString() !== req.user.userId && 
        task.backupOwner?._id.toString() !== req.user.userId &&
        req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      category,
      tags,
      backupOwner
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = new Task({
      title,
      description,
      owner: req.user.userId,
      priority: priority || 'medium',
      dueDate,
      category,
      tags: tags || [],
      backupOwner: backupOwner || null,
      isRisk: !backupOwner // Risk if no backup owner
    });

    await task.save();
    await task.populate('owner', 'name email');
    await task.populate('backupOwner', 'name email');

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership or admin/manager
    if (task.owner.toString() !== req.user.userId && 
        req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      category,
      tags,
      backupOwner,
      isRisk,
      riskReason
    } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (category !== undefined) task.category = category;
    if (tags) task.tags = tags;
    if (backupOwner !== undefined) {
      task.backupOwner = backupOwner;
      // Update risk status based on backup owner
      task.isRisk = !backupOwner;
    }
    if (isRisk !== undefined) task.isRisk = isRisk;
    if (riskReason !== undefined) task.riskReason = riskReason;

    await task.save();
    await task.populate('owner', 'name email');
    await task.populate('backupOwner', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership or admin
    if (task.owner.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks by backup owner (for managers)
router.get('/backup/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.find({ backupOwner: req.params.userId })
      .populate('owner', 'name email')
      .populate('backupOwner', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Add or update handover notes for a task
// PUT /api/tasks/:id/handover
router.put('/:id/handover', authenticateToken, async (req, res) => {
  try {
    const { handoverNotes } = req.body;

    if (!handoverNotes) {
      return res.status(400).json({ error: 'Handover notes are required' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only owner, admin, or manager can add handover notes
    if (
      task.owner.toString() !== req.user.userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    task.handoverNotes = handoverNotes;

    await task.save();
    await task.populate('handoverNotes');

    res.json({
      message: 'Handover notes updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
