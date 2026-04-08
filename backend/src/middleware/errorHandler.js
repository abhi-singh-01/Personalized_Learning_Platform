const { NODE_ENV } = require('../config/env');
const path = require('path');
const fs = require('fs');

const errorLogPath = path.join(__dirname, '..', '..', 'error_logs.txt');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Async logging — non-blocking
  const logEntry = `[${new Date().toISOString()}] ${statusCode} - ${message}\nDetails: ${JSON.stringify(err.errors || {})}\n\n`;
  fs.appendFile(errorLogPath, logEntry, (writeErr) => {
    if (writeErr) console.error('Failed to write error log:', writeErr.message);
  });

  if (NODE_ENV === 'development') {
    console.error(`[ERROR ${statusCode}]`, message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: NODE_ENV === 'development' ? { stack: err.stack } : null,
  });
};

module.exports = errorHandler;