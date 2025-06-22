const Item = require('../models/itemModel');

// Create new item
exports.createItem = async (req, res) => {
    try {
        // Add creator and updater info
        req.body.createdBy = req.user.id;
        req.body.updatedBy = req.user.id;

        const newItem = await Item.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                item: newItem
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get all items with filtering, sorting, and pagination
exports.getAllItems = async (req, res) => {
    try {
        // Build query
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        
        let query = Item.find(JSON.parse(queryStr));

        // Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Field limiting
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        query = query.skip(skip).limit(limit);

        // Execute query
        const items = await query;
        const total = await Item.countDocuments(JSON.parse(queryStr));

        res.status(200).json({
            status: 'success',
            results: items.length,
            total,
            data: {
                items
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get single item
exports.getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                status: 'fail',
                message: 'No item found with that ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                item
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Update item
exports.updateItem = async (req, res) => {
    try {
        // Add updater info
        req.body.updatedBy = req.user.id;

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!item) {
            return res.status(404).json({
                status: 'fail',
                message: 'No item found with that ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                item
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Delete item
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({
                status: 'fail',
                message: 'No item found with that ID'
            });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get item statistics
exports.getItemStats = async (req, res) => {
    try {
        const stats = await Item.aggregate([
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalValue: { $sum: '$purchaseInfo.price' },
                    avgValue: { $avg: '$purchaseInfo.price' },
                    minValue: { $min: '$purchaseInfo.price' },
                    maxValue: { $max: '$purchaseInfo.price' }
                }
            }
        ]);

        const categoryStats = await Item.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$purchaseInfo.price' }
                }
            }
        ]);

        const conditionStats = await Item.aggregate([
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                overall: stats[0],
                byCategory: categoryStats,
                byCondition: conditionStats
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}; 