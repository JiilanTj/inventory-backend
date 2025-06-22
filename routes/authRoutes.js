const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.get('/validate-token', protect, authController.validateToken);

// Admin routes
router.post('/register-admin', protect, isAdmin, authController.registerAdmin);
router.get('/users', protect, isAdmin, authController.getAllUsers);

// Example of protected admin route
// router.get('/admin-only', protect, isAdmin, adminController.someAdminFunction);

module.exports = router;
