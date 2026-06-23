const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const HandoverNote = require('../models/HandoverNote');
const Availability = require('../models/Availability');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

// Employee Dashboard
router.get('/employee', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get task counts
    const activeTasks = await Task.countDocuments({ 
      owner: userId, 
      status: { $in: ['pending', 'in-progress'] } 
    });
    
    const pendingHandovers = await HandoverNote.countDocuments({ 
      fromUser: userId, 
      status: 'pending' 
    });

    const riskTasks = await Task.countDocuments({ 
      owner: userId, 
      isRisk: true 
    });

    // Get availability
    const availability = await Availability.findOne({ user: userId });
    const availabilityStatus = availability?.status || 'available';

    // Get risk tasks details
    const riskTasksList = await Task.find({ 
      owner: userId, 
      isRisk: true 
    })
    .populate('backupOwner', 'name email')
    .limit(5);

    // Get pending handovers
    const pendingHandoversList = await HandoverNote.find({ 
      fromUser: userId, 
      status: 'pending' 
    })
    .populate('task', 'title')
    .populate('toUser', 'name email')
    .limit(5);

    res.json({
      stats: {
        activeTasks,
        pendingHandovers,
        riskTasks,
        availabilityStatus
      },
      riskTasks: riskTasksList,
      pendingHandovers: pendingHandoversList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manager Dashboard
router.get('/manager', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all users in team (assuming manager can see all employees)
    const teamMembers = await User.find({ 
      role: 'employee',
      isActive: true 
    }).select('name email');

    const teamMemberIds = teamMembers.map(m => m._id);

    // Get team stats
    const totalTeamTasks = await Task.countDocuments({ 
      owner: { $in: teamMemberIds } 
    });

    const highRiskTasks = await Task.countDocuments({ 
      owner: { $in: teamMemberIds },
      isRisk: true 
    });

    const pendingHandovers = await HandoverNote.countDocuments({ 
      fromUser: { $in: teamMemberIds },
      status: 'pending' 
    });

    const unavailableMembers = await Availability.countDocuments({ 
      user: { $in: teamMemberIds },
      status: { $in: ['unavailable', 'on-leave', 'sick-leave', 'vacation'] }
    });

    // Get high risk tasks
    const highRiskTasksList = await Task.find({ 
      owner: { $in: teamMemberIds },
      isRisk: true 
    })
    .populate('owner', 'name email')
    .populate('backupOwner', 'name email')
    .limit(10);

    // Get pending handovers
    const pendingHandoversList = await HandoverNote.find({ 
      fromUser: { $in: teamMemberIds },
      status: 'pending' 
    })
    .populate('task', 'title')
    .populate('fromUser', 'name email')
    .populate('toUser', 'name email')
    .limit(10);

    // Get unavailable members
    const unavailableMembersList = await Availability.find({ 
      user: { $in: teamMemberIds },
      status: { $in: ['unavailable', 'on-leave', 'sick-leave', 'vacation'] }
    })
    .populate('user', 'name email')
    .limit(10);

    res.json({
      stats: {
        totalTeamTasks,
        highRiskTasks,
        pendingHandovers,
        unavailableMembers,
        teamSize: teamMembers.length
      },
      highRiskTasks: highRiskTasksList,
      pendingHandovers: pendingHandoversList,
      unavailableMembers: unavailableMembersList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Dashboard
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // System-wide stats
    const totalUsers = await User.countDocuments();
    const activeEmployees = await User.countDocuments({ 
      role: 'employee',
      isActive: true 
    });
    const managers = await User.countDocuments({ role: 'manager' });
    const openRiskTasks = await Task.countDocuments({ isRisk: true });

    // Get recent users
    const recentUsers = await User.find()
      .select('name email role lastActive isActive')
      .sort({ lastActive: -1 })
      .limit(10);

    // Get system alerts
    const tasksWithoutBackup = await Task.countDocuments({ 
      backupOwner: null,
      status: { $in: ['pending', 'in-progress'] }
    });

    const inactiveUsers = await User.countDocuments({ 
      lastActive: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      isActive: true
    });

    const pendingHandovers = await HandoverNote.countDocuments({ 
      status: 'pending' 
    });

    res.json({
      stats: {
        totalUsers,
        activeEmployees,
        managers,
        openRiskTasks
      },
      alerts: {
        tasksWithoutBackup,
        inactiveUsers,
        pendingHandovers
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for dropdowns, etc.)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email role')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
