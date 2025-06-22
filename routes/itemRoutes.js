const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', itemController.getAllItems);
router.get('/stats', itemController.getItemStats);
router.get('/:id', itemController.getItem);

// Protected admin routes
router.use(protect);
router.use(isAdmin);

// Protected CRUD routes
router.post('/', itemController.createItem);

router.route('/:id')
    .patch(itemController.updateItem)
    .delete(itemController.deleteItem);

module.exports = router; 