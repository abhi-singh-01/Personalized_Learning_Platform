const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

exports.getDashboardStats = async (req, res, next) => {
    try {
        const [totalLearners, totalEducators, totalCourses, totalQuizAttempts] = await Promise.all([
            User.countDocuments({ role: 'learner' }),
            User.countDocuments({ role: 'educator' }),
            Course.countDocuments(),
            Progress.countDocuments(),
        ]);

        sendResponse(res, 200, 'Admin stats fetched', {
            totalLearners,
            totalEducators,
            totalCourses,
            totalQuizAttempts,
        });
    } catch (err) { next(err); }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password -__v').sort({ createdAt: -1 });
        sendResponse(res, 200, 'All users fetched', users);
    } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            throw new AppError('Missing required fields', 400);
        }

        const exists = await User.findOne({ email });
        if (exists) throw new AppError('Email already exists', 400);

        const user = await User.create({ name, email, password, role });
        user.password = undefined;

        sendResponse(res, 201, 'User created successfully', user);
    } catch (err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['learner', 'educator', 'admin'].includes(role)) {
            throw new AppError('Invalid role', 400);
        }

        const user = await User.findById(req.params.id);
        if (!user) throw new AppError('User not found', 404);

        // Prevent removing the last admin
        if (user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) throw new AppError('Cannot demote the last admin', 400);
        }

        user.role = role;
        await user.save();

        user.password = undefined;
        sendResponse(res, 200, 'User role updated', user);
    } catch (err) { next(err); }
};

exports.assignLearnerToEducator = async (req, res, next) => {
    try {
        const { learnerId, educatorId } = req.body;

        const learner = await User.findOne({ _id: learnerId, role: 'learner' });
        const educator = await User.findOne({ _id: educatorId, role: 'educator' });

        if (!learner || !educator) {
            throw new AppError('Invalid learner or educator ID', 400);
        }

        // Add learner to educator's assigned array if not already present
        if (!educator.assignedLearners.includes(learnerId)) {
            educator.assignedLearners.push(learnerId);
            await educator.save();
        }

        sendResponse(res, 200, 'Learner assigned to educator successfully', { educatorId, learnerId });
    } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) throw new AppError('User not found', 404);

        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) throw new AppError('Cannot delete the last admin', 400);
        }

        await User.findByIdAndDelete(req.params.id);
        sendResponse(res, 200, 'User deleted successfully');
    } catch (err) { next(err); }
};

// Course Management for Admin
const Material = require('../models/Material');

exports.getAllCourses = async (req, res, next) => {
    try {
        // Populate educator details and materials count
        const courses = await Course.find()
            .populate('educator', 'name email')
            .sort({ createdAt: -1 })
            .lean(); // Use lean to deal with raw JS objects

        // For each course, fetch its materials
        const enrichedCourses = await Promise.all(courses.map(async (c) => {
            const materials = await Material.find({ course: c._id }).select('_id title type').lean();
            c.materials = materials;
            return c;
        }));

        sendResponse(res, 200, 'All courses fetched', enrichedCourses);
    } catch (err) { next(err); }
};

exports.updateCourseAdmin = async (req, res, next) => {
    try {
        const { title, description, category, difficulty, isPublished, educator } = req.body;

        const course = await Course.findById(req.params.id);
        if (!course) throw new AppError('Course not found', 404);

        if (title) course.title = title;
        if (description) course.description = description;
        if (category) course.category = category;
        if (difficulty) course.difficulty = difficulty;
        if (isPublished !== undefined) course.isPublished = isPublished;

        // Admin reassigning a course to a different educator
        if (educator && educator !== course.educator.toString()) {
            const newEducator = await User.findOne({ _id: educator, role: 'educator' });
            if (!newEducator) throw new AppError('Invalid educator ID', 400);
            course.educator = educator;
        }

        await course.save();
        sendResponse(res, 200, 'Course updated successfully', course);
    } catch (err) { next(err); }
};

exports.deleteCourseAdmin = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) throw new AppError('Course not found', 404);

        // Clean up materials
        await Material.deleteMany({ course: course._id });
        await course.deleteOne();

        sendResponse(res, 200, 'Course and its materials deleted');
    } catch (err) { next(err); }
};

exports.deleteMaterialAdmin = async (req, res, next) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) throw new AppError('Material not found', 404);

        await material.deleteOne();
        sendResponse(res, 200, 'Material deleted successfully');
    } catch (err) { next(err); }
};

// Global System Settings for Admin
const Setting = require('../models/Setting');

exports.getSettings = async (req, res, next) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        sendResponse(res, 200, 'Settings fetched', settings);
    } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const { siteName, maintenanceMode, aiEnabled, geminiApiKey } = req.body;

        let settings = await Setting.findOne();
        if (!settings) settings = new Setting({});

        if (siteName !== undefined) settings.siteName = siteName;
        if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
        if (aiEnabled !== undefined) settings.aiEnabled = aiEnabled;
        if (geminiApiKey !== undefined) settings.geminiApiKey = geminiApiKey;

        await settings.save();
        sendResponse(res, 200, 'Settings updated', settings);
    } catch (err) { next(err); }
};

const Progress = require('../models/Progress');

exports.getAnalytics = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        const courseDist = await Course.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        const quizActivity = await Progress.aggregate([
            { $match: { completedAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
            { $sort: { "_id": 1 } }
        ]);

        const totalLearners = await User.countDocuments({ role: 'learner' });
        const totalEducators = await User.countDocuments({ role: 'educator' });
        const totalCourses = await Course.countDocuments();

        const trends = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const uGrowth = userGrowth.find(x => x._id === dateStr)?.count || 0;
            const qActivity = quizActivity.find(x => x._id === dateStr)?.count || 0;

            trends.push({ date: dateStr, newUsers: uGrowth, quizzesTaken: qActivity });
        }

        sendResponse(res, 200, 'Admin analytics fetched', {
            trends,
            courseDistribution: courseDist.map(c => ({ name: c._id || 'Uncategorized', value: c.count })),
            totals: { learners: totalLearners, educators: totalEducators, courses: totalCourses }
        });
    } catch (err) { next(err); }
};
