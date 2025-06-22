const mongoose = require('mongoose');
const { getCurrentWIB, convertToWIB } = require('../utils/timeHelper');

const borrowSchema = new mongoose.Schema({
    borrowCode: {
        type: String,
        unique: true,
        required: true,
        default: () => 'BRW' + getCurrentWIB().getTime().toString().slice(-8)
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Peminjaman harus terkait dengan user']
    },
    items: [{
        item: {
            type: mongoose.Schema.ObjectId,
            ref: 'Item',
            required: [true, 'Peminjaman harus memiliki barang']
        },
        condition: {
            type: String,
            required: true,
            enum: ['Baik', 'Rusak Ringan', 'Rusak Berat'],
            default: 'Baik'
        },
        notes: String
    }],
    borrowDate: {
        type: Date,
        required: [true, 'Tanggal peminjaman harus diisi'],
        default: getCurrentWIB
    },
    dueDate: {
        type: Date,
        required: [true, 'Tanggal pengembalian harus diisi'],
        validate: {
            validator: function(value) {
                // Pastikan tanggal valid
                if (!(value instanceof Date) || isNaN(value)) {
                    return false;
                }
                // Pastikan tanggal pengembalian setelah tanggal peminjaman
                return value > this.borrowDate;
            },
            message: props => {
                if (!(props.value instanceof Date) || isNaN(props.value)) {
                    return 'Format tanggal tidak valid. Gunakan format: YYYY-MM-DDTHH:mm:ss.sssZ';
                }
                return 'Tanggal pengembalian harus setelah tanggal peminjaman';
            }
        },
        set: function(val) {
            if (val instanceof Date) {
                return convertToWIB(val);
            }
            // Coba parse jika string
            const parsed = new Date(val);
            if (!isNaN(parsed)) {
                return convertToWIB(parsed);
            }
            return val; // Biarkan mongoose handle error
        }
    },
    returnDate: {
        type: Date,
        set: function(val) {
            return convertToWIB(val);
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    returnCondition: {
        type: String,
        enum: ['Baik', 'Rusak Ringan', 'Rusak Berat']
    },
    returnNotes: String,
    purpose: {
        type: String,
        required: [true, 'Tujuan peminjaman harus diisi']
    }
}, {
    timestamps: {
        currentTime: getCurrentWIB
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field untuk menghitung keterlambatan
borrowSchema.virtual('isLate').get(function() {
    if (!this.returnDate && this.dueDate < getCurrentWIB()) {
        return true;
    }
    return false;
});

// Virtual field untuk menghitung durasi peminjaman
borrowSchema.virtual('duration').get(function() {
    const end = this.returnDate || getCurrentWIB();
    const duration = Math.ceil((end - this.borrowDate) / (1000 * 60 * 60 * 24));
    return duration;
});

// Middleware untuk populate references
borrowSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name email class'
    }).populate({
        path: 'items.item',
        select: 'name code category'
    }).populate({
        path: 'approvedBy',
        select: 'name email'
    });
    
    next();
});

// Middleware untuk update status otomatis
borrowSchema.pre('save', function(next) {
    // Update status menjadi overdue jika telah melewati dueDate
    if (this.status === 'borrowed' && this.dueDate < getCurrentWIB()) {
        this.status = 'overdue';
    }
    next();
});

const Borrow = mongoose.model('Borrow', borrowSchema);
module.exports = Borrow; 