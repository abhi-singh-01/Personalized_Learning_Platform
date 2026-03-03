const jwt = require('jsonwebtoken');
const Setting = require('../models/Setting');
const { JWT_SECRET } = require('../config/env');
const { sendResponse } = require('../utils/response');

const maintenance = async (req, res, next) => {
    try {
        const settings = await Setting.findOne();

        // If maintenance mode is not enabled, proceed normally
        if (!settings || !settings.maintenanceMode) {
            return next();
        }

        // Always allow login so admins can authenticate
        if (req.path === '/api/auth/login') {
            return next();
        }

        // Check if the requester is an admin
        let isAdmin = false;
        const header = req.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
            try {
                const token = header.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.role === 'admin') {
                    isAdmin = true;
                }
            } catch (e) {
                // Token verification failed, proceed as non-admin
            }
        }

        if (isAdmin) {
            return next();
        }

        return sendResponse(res, 503, 'Sorry for the inconvenience, the website is under maintenance.');
    } catch (err) {
        next(err);
    }
};

module.exports = maintenance;
