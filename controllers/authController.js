const User = require('../models/userModels');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Generate JWT Token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

// Register new user
exports.register = async (req, res) => {
    try {
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            class: req.body.class,
            role: req.body.role || 'user', // Default to 'user' if not specified
            password: req.body.password
        });

        createSendToken(newUser, 201, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }

        // Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get current user (me)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Validate token
exports.validateToken = async (req, res) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'No token provided. Please provide a Bearer token in Authorization header'
            });
        }

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid token'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: 'Invalid token or token expired'
        });
    }
};

// Register new admin (only accessible by admins)
exports.registerAdmin = async (req, res) => {
    try {
        // Force the role to be admin regardless of what's sent in the request
        const newAdmin = await User.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            class: req.body.class,
            role: 'admin', // Force role to be admin
            password: req.body.password
        });

        createSendToken(newAdmin, 201, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get all users with optional role filter (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        // Build query
        let query = User.find();
        
        // Apply role filter if provided
        if (req.query.role) {
            if (!['admin', 'user'].includes(req.query.role)) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid role. Must be either "admin" or "user"'
                });
            }
            query = query.where('role').equals(req.query.role);
        }

        // Execute query
        const users = await query.select('-__v');

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};
