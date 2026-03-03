const AppError = require('../utils/AppError');

const role = (...roles) => (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!roles.includes(req.user.role))
    return next(new AppError('Access denied', 403));
  next();
};

module.exports = role;