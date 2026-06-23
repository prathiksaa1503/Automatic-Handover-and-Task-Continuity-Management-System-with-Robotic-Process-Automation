const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'css')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/handovers', require('./routes/handovers'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ✅ EXPORT ROUTE (FOR CSV / UIPATH)
app.use('/api/export', require('./routes/export'));

// Serve HTML files
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(
    path.join(__dirname, req.path === '/' ? 'index.html' : req.path)
  );
});

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/workhandover';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI}`);
});
