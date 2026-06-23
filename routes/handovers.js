const express = require('express');
const router = express.Router();
const HandoverNote = require('../models/HandoverNote');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');

// Get all handover notes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      $or: [
        { fromUser: req.user.userId },
        { toUser: req.user.userId }
      ]
    };

    if (status) query.status = status;

    const handovers = await HandoverNote.find(query)
      .populate('task', 'title description')
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 });

    res.json(handovers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get handover by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const handover = await HandoverNote.findById(req.params.id)
      .populate('task', 'title description')
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    if (!handover) {
      return res.status(404).json({ error: 'Handover note not found' });
    }

    // Check access
    if (handover.fromUser._id.toString() !== req.user.userId &&
        handover.toUser._id.toString() !== req.user.userId &&
        req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(handover);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create handover note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      taskId,
      toUser,
      knowledgeTransfer,
      keyContacts,
      importantFiles,
      accessCredentials
    } = req.body;

    if (!taskId || !toUser || !knowledgeTransfer) {
      return res.status(400).json({ error: 'Task ID, recipient user, and knowledge transfer are required' });
    }

    // Verify task exists and user owns it
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only create handover notes for your own tasks' });
    }

    // Create handover note
    const handoverNote = new HandoverNote({
      task: taskId,
      fromUser: req.user.userId,
      toUser,
      knowledgeTransfer,
      keyContacts: keyContacts || [],
      importantFiles: importantFiles || [],
      accessCredentials: accessCredentials || [],
      status: 'pending'
    });

    await handoverNote.save();

    // Link handover note to task
    task.handoverNotes = handoverNote._id;
    await task.save();

    // Update task backup owner if not set
    if (!task.backupOwner) {
      task.backupOwner = toUser;
      task.isRisk = false;
      await task.save();
    }

    await handoverNote.populate('task', 'title description');
    await handoverNote.populate('fromUser', 'name email');
    await handoverNote.populate('toUser', 'name email');

    res.status(201).json(handoverNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update handover note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const handover = await HandoverNote.findById(req.params.id);

    if (!handover) {
      return res.status(404).json({ error: 'Handover note not found' });
    }

    // Check access
    if (handover.fromUser.toString() !== req.user.userId &&
        req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      knowledgeTransfer,
      keyContacts,
      importantFiles,
      accessCredentials
    } = req.body;

    if (knowledgeTransfer) handover.knowledgeTransfer = knowledgeTransfer;
    if (keyContacts) handover.keyContacts = keyContacts;
    if (importantFiles) handover.importantFiles = importantFiles;
    if (accessCredentials) handover.accessCredentials = accessCredentials;

    await handover.save();
    await handover.populate('task', 'title description');
    await handover.populate('fromUser', 'name email');
    await handover.populate('toUser', 'name email');

    res.json(handover);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge handover (for recipient)
router.post('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const handover = await HandoverNote.findById(req.params.id);

    if (!handover) {
      return res.status(404).json({ error: 'Handover note not found' });
    }

    if (handover.toUser.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the recipient can acknowledge this handover' });
    }

    handover.status = 'acknowledged';
    handover.acknowledgedAt = new Date();
    await handover.save();

    res.json({ message: 'Handover acknowledged', handover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete handover
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const handover = await HandoverNote.findById(req.params.id);

    if (!handover) {
      return res.status(404).json({ error: 'Handover note not found' });
    }

    if (handover.toUser.toString() !== req.user.userId &&
        req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    handover.status = 'completed';
    handover.completedAt = new Date();
    await handover.save();

    res.json({ message: 'Handover completed', handover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
