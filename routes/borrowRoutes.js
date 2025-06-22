const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes accessible by all authenticated users
router.post('/', borrowController.createBorrow);
router.get('/my', borrowController.getAllBorrows); // Will only show user's own borrows

// Admin only routes
router.use(isAdmin);
router.get('/', borrowController.getAllBorrows); // Show all borrows
router.get('/stats', borrowController.getBorrowStats);

// Routes for both admin and borrowing user
router.route('/:id')
    .get(borrowController.getBorrow)
    .patch(borrowController.updateBorrowStatus); // Only admin can update status

module.exports = router;