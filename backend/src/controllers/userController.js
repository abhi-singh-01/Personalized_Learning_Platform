const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, preferences } = req.body;
    const update = {};
    if (name) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (avatar !== undefined) update.avatar = avatar;
    if (preferences) update.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true, runValidators: true,
    }).select('-password');

    sendResponse(res, 200, 'Profile updated', user);
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      throw new AppError('Current password is incorrect', 400);

    user.password = newPassword;
    await user.save();
    sendResponse(res, 200, 'Password changed successfully');
  } catch (err) { next(err); }
};

exports.createStudentByTeacher = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Missing required fields', 400);
    }

    const exists = await User.findOne({ email });
    if (exists) throw new AppError('Email already exists', 400);

    const student = await User.create({ name, email, password, role: 'student' });

    // Assign to teacher
    const teacher = await User.findById(req.user._id);
    teacher.assignedStudents.push(student._id);
    await teacher.save();

    student.password = undefined;
    sendResponse(res, 201, 'Student created and assigned', student);
  } catch (err) { next(err); }
};