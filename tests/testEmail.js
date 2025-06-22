require('dotenv').config();
const mongoose = require('mongoose');
const Borrow = require('../models/borrowModel');
const emailService = require('../utils/emailService');

const testEmail = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get a sample borrow
        const borrow = await Borrow.findOne()
            .populate('user', 'name email class')
            .populate('items.item', 'name code');

        if (!borrow) {
            console.log('❌ No borrow found in database');
            process.exit(1);
        }

        console.log('📧 Testing email notifications...');

        // Test all email types
        await Promise.all([
            emailService.sendNewBorrowNotification(borrow),
            emailService.sendStatusUpdateNotification(borrow, 'pending'),
            emailService.sendDueDateReminder(borrow),
            emailService.sendOverdueNotification(borrow)
        ]);

        console.log('✅ All email notifications sent successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testEmail(); 