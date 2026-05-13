const AppError = require('../utils/AppError');

const expand = (r) => {
  if (r === 'educator') return ['educator', 'teacher'];
  if (r === 'learner') return ['learner', 'student'];
  return [r];
};

const role = (...roles) => (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const allowed = [...new Set(roles.flatMap(expand))];
  if (!allowed.includes(req.user.role))
    return next(new AppError('Access denied', 403));
  next();
};

module.exports = role;