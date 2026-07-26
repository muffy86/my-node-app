const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const infoRoutes = require('./routes/info');
const usersRoutes = require('./routes/users');

const app = express();

// --- Middleware ---

// Parse JSON request bodies
app.use(express.json());

// Request logging
app.use(logger);

// --- Routes ---

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Node.js!', env: process.env.NODE_ENV || 'development' });
});

app.use('/api/health', healthRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/users', usersRoutes);

// 404 handler — must come after all routes
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not Found', status: 404 } });
});

// Error-handling middleware — must come last
app.use(errorHandler);

module.exports = app;
