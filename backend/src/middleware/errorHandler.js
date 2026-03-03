const { NODE_ENV } = require('../config/env');

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

  const fs = require('fs');
  fs.appendFileSync('error_logs.txt', `[${new Date().toISOString()}] ${statusCode} - ${message}\nDetails: ${JSON.stringify(err.errors || {})}\n\n`);

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: NODE_ENV === 'development' ? { stack: err.stack } : null,
  });
};

module.exports = errorHandler;