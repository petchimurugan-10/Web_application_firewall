// server.js - Main Express Server
const express = require('express');
const cors = require('cors');
const postsRoutes = require('./routes/posts');
const searchRoutes = require('./routes/search');
const commentsRoutes = require('./routes/comments');
const wafLogsRoutes = require('./routes/logs');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Routes
app.use('/api/posts', postsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/waf-logs', wafLogsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vulnerable Blog API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`⚠️  WARNING: Running VULNERABLE server on port ${PORT}`);
  console.log(`⚠️  This server contains intentional security flaws for testing`);
  console.log(`⚠️  DO NOT deploy to production!`);
});
