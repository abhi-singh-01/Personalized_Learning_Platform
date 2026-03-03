const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Setting = require('../models/Setting');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const signToken = (id, role) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) throw new AppError('Email already registered', 400);

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id, user.role);

    sendResponse(res, 201, 'Registration successful', {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) { next(err); }
};

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      throw new AppError('Invalid email or password', 401);

    const settings = await Setting.findOne();
    if (settings && settings.maintenanceMode && user.role !== 'admin') {
      throw new AppError('Sorry for the inconvenience, the website is under maintenance.', 503);
    }

    const token = signToken(user._id, user.role);
    sendResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, aiLevel: user.aiLevel,
      },
    });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('enrolledCourses', 'title category thumbnail')
      .populate('assignedStudents', 'name email aiLevel engagementScore averageScore streak');
    sendResponse(res, 200, 'User profile', user);
  } catch (err) { next(err); }
};