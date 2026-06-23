const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const Task = require('../models/Task');
const Availability = require('../models/Availability');

// EXPORT HANDOVER TASKS TO CSV
// GET /api/export/handover
router.get('/handover', async (req, res) => {
  try {
    // 1️⃣ Find unavailable users
    const unavailable = await Availability.find({ status: 'unavailable' });

    if (!unavailable.length) {
      return res.json({ message: 'No users on leave' });
    }

    const userIds = unavailable.map(u => u.user);

    // 2️⃣ Find tasks owned by unavailable users
    const tasks = await Task.find({
      owner: { $in: userIds },
      backupOwner: { $ne: null },
      handoverNotes: { $ne: null }
    })
      .populate('owner', 'name email')
      .populate('backupOwner', 'name email')
      .populate('handoverNotes');

    if (!tasks.length) {
      return res.json({ message: 'No handover tasks found for unavailable users' });
    }

    // 3️⃣ Prepare CSV data
    const csvData = tasks.map(task => ({
      Task_Title: task.title,
      Owner_Name: task.owner.name,
      Owner_Email: task.owner.email,
      Backup_Name: task.backupOwner.name,
      Backup_Email: task.backupOwner.email,
      Handover_Notes: task.handoverNotes?.notes || '',
      Status: task.status,
      Priority: task.priority,
      Due_Date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''
    }));

    // 4️⃣ Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // 5️⃣ Save CSV to automation/output
    const outputDir = path.join(__dirname, '../automation/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, 'handover_tasks.csv');
    fs.writeFileSync(filePath, csv);

    res.json({
      message: 'CSV exported successfully',
      file: 'automation/output/handover_tasks.csv',
      records: csvData.length
    });

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'CSV export failed' });
  }
});

module.exports = router;
