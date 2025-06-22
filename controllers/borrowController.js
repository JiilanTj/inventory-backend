const Borrow = require('../models/borrowModel');
const Item = require('../models/itemModel');
const { getCurrentWIB, convertToWIB, getStartOfDayWIB, getEndOfDayWIB } = require('../utils/timeHelper');
const emailService = require('../utils/emailService');

// Create borrow request
exports.createBorrow = async (req, res) => {
    try {
        // Add user from token
        req.body.user = req.user.id;
        
        // Convert dates to WIB
        if (req.body.dueDate) {
            req.body.dueDate = convertToWIB(req.body.dueDate);
        }
        
        // Validate items existence and availability
        const itemIds = req.body.items.map(item => item.item);
        const items = await Item.find({ _id: { $in: itemIds } });

        // Check if all items exist
        if (items.length !== itemIds.length) {
            const foundIds = items.map(item => item._id.toString());
            const notFoundIds = itemIds.filter(id => !foundIds.includes(id));
            return res.status(400).json({
                status: 'fail',
                message: `Beberapa barang tidak ditemukan dengan ID: ${notFoundIds.join(', ')}`
            });
        }
        
        // Check if all items are available
        const unavailableItems = items.filter(item => item.status !== 'Tersedia');
        if (unavailableItems.length > 0) {
            return res.status(400).json({
                status: 'fail',
                message: `Beberapa barang tidak tersedia: ${unavailableItems.map(item => item.name).join(', ')}`
            });
        }

        const borrow = await Borrow.create(req.body);

        // Update items status to 'Dipinjam'
        await Item.updateMany(
            { _id: { $in: itemIds } },
            { status: 'Dipinjam' }
        );

        // Send email notification to admin
        const populatedBorrow = await Borrow.findById(borrow._id)
            .populate('user', 'name email class')
            .populate('items.item', 'name code');
        
        await emailService.sendNewBorrowNotification(populatedBorrow);

        // Return populated response
        const fullBorrow = await Borrow.findById(borrow._id)
            .populate('user', 'name email class')
            .populate('items.item', 'name code category');

        res.status(201).json({
            status: 'success',
            data: {
                borrow: fullBorrow
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get all borrows with filtering
exports.getAllBorrows = async (req, res) => {
    try {
        // Build query
        let query = Borrow.find();

        // Filter by status
        if (req.query.status) {
            query = query.find({ status: req.query.status });
        }

        // Filter by user (if not admin)
        if (req.user.role !== 'admin') {
            query = query.find({ user: req.user.id });
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            query = query.find({
                borrowDate: {
                    $gte: convertToWIB(req.query.startDate),
                    $lte: convertToWIB(req.query.endDate)
                }
            });
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        query = query.skip(skip).limit(limit);

        // Execute query
        const borrows = await query;
        const total = await Borrow.countDocuments();

        res.status(200).json({
            status: 'success',
            results: borrows.length,
            total,
            data: {
                borrows
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get single borrow
exports.getBorrow = async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.id);

        if (!borrow) {
            return res.status(404).json({
                status: 'fail',
                message: 'Peminjaman tidak ditemukan'
            });
        }

        // Check if user has permission to view this borrow
        if (req.user.role !== 'admin' && borrow.user.id !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'Anda tidak memiliki akses ke peminjaman ini'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                borrow
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Approve/Reject borrow request (Admin only)
exports.updateBorrowStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'borrowed', 'returned'].includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Status tidak valid'
            });
        }

        const borrow = await Borrow.findById(req.params.id);
        if (!borrow) {
            return res.status(404).json({
                status: 'fail',
                message: 'Peminjaman tidak ditemukan'
            });
        }

        const oldStatus = borrow.status;

        // Update borrow status
        borrow.status = status;
        borrow.approvedBy = req.user.id;

        if (status === 'returned') {
            borrow.returnDate = getCurrentWIB();
            borrow.returnCondition = req.body.returnCondition;
            borrow.returnNotes = req.body.returnNotes;

            // Update items status
            const itemIds = borrow.items
                .map(item => item.item && item.item._id ? item.item._id : null)
                .filter(Boolean);
            if (itemIds.length > 0) {
                await Item.updateMany(
                    { _id: { $in: itemIds } },
                    { 
                        status: 'Tersedia',
                        condition: req.body.returnCondition
                    }
                );
            }
        }

        await borrow.save();

        // Send email notification to user
        const populatedBorrow = await Borrow.findById(borrow._id)
            .populate('user', 'name email class')
            .populate('items.item', 'name code');
        
        await emailService.sendStatusUpdateNotification(populatedBorrow, oldStatus);

        res.status(200).json({
            status: 'success',
            data: {
                borrow
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get borrow statistics (Admin only)
exports.getBorrowStats = async (req, res) => {
    try {
        const stats = await Borrow.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    items: { $sum: { $size: '$items' } }
                }
            }
        ]);

        const overdue = await Borrow.countDocuments({
            status: 'borrowed',
            dueDate: { $lt: getCurrentWIB() }
        });

        const today = await Borrow.countDocuments({
            status: 'borrowed',
            dueDate: {
                $gte: getStartOfDayWIB(),
                $lt: getEndOfDayWIB()
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                stats,
                overdue,
                returnToday: today
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}; 