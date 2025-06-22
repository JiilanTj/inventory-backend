const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Protect all routes and restrict to admin only
router.use(protect);
router.use(isAdmin);

// Export items
router.get('/items/excel', exportController.exportItemsToExcel);
router.get('/items/pdf', exportController.exportItemsToPDF);

// Export borrows
router.get('/borrows/excel', exportController.exportBorrowsToExcel);
router.get('/borrows/pdf', exportController.exportBorrowsToPDF);

module.exports = router; 