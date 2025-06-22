const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
        default: () => 'ITM' + Date.now().toString().slice(-8)
    },
    name: {
        type: String,
        required: [true, 'Please provide item name'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please provide item category'],
        enum: ['Hardware', 'Peripheral', 'Development Tools', 'Software License', 'Lab Equipment'],
    },
    specifications: {
        type: Map,
        of: String,
        default: {}
    },
    condition: {
        type: String,
        required: true,
        enum: ['Baik', 'Rusak Ringan', 'Rusak Berat'],
        default: 'Baik'
    },
    status: {
        type: String,
        required: true,
        enum: ['Tersedia', 'Dipinjam', 'Dalam Perbaikan'],
        default: 'Tersedia'
    },
    location: {
        type: String,
        required: [true, 'Please provide item location'],
        enum: ['Lab 1', 'Lab 2', 'Lab 3', 'Gudang']
    },
    purchaseInfo: {
        price: {
            type: Number,
            required: [true, 'Please provide purchase price']
        },
        date: {
            type: Date,
            required: [true, 'Please provide purchase date']
        },
        warranty: {
            type: Date,
            required: [true, 'Please provide warranty date']
        }
    },
    images: [{
        type: String, // URL to image
        required: false
    }],
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Create index for better search performance
itemSchema.index({ code: 1, name: 1, category: 1, status: 1 });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item; 