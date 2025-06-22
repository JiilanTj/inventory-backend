const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModels');

// Protect routes - Verify token and attach user to request
exports.protect = async (req, res, next) => {
    try {
        // Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // Check if user changed password after token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                status: 'fail',
                message: 'User recently changed password! Please log in again.'
            });
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: 'Invalid token or token expired'
        });
    }
};

// Check if user is admin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Error checking user role'
        });
    }
}; 