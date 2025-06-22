const Borrow = require('../models/borrowModel');
const { getCurrentWIB, getStartOfDayWIB, getEndOfDayWIB } = require('./timeHelper');
const emailService = require('./emailService');

// Kirim reminder untuk peminjaman yang akan jatuh tempo besok
const sendDueDateReminders = async () => {
    try {
        const tomorrow = new Date(getCurrentWIB());
        tomorrow.setDate(tomorrow.getDate() + 1);

        const borrows = await Borrow.find({
            status: 'borrowed',
            dueDate: {
                $gte: getStartOfDayWIB(),
                $lt: getEndOfDayWIB()
            }
        }).populate('user', 'name email class')
          .populate('items.item', 'name code');

        for (const borrow of borrows) {
            await emailService.sendDueDateReminder(borrow);
        }

        console.log(`✉️ Sent ${borrows.length} due date reminders`);
    } catch (error) {
        console.error('❌ Error sending due date reminders:', error);
    }
};

// Kirim notifikasi untuk peminjaman yang terlambat
const sendOverdueNotifications = async () => {
    try {
        const borrows = await Borrow.find({
            status: 'borrowed',
            dueDate: { $lt: getCurrentWIB() }
        }).populate('user', 'name email class')
          .populate('items.item', 'name code');

        for (const borrow of borrows) {
            // Update status to overdue
            borrow.status = 'overdue';
            await borrow.save();
            
            // Send notification
            await emailService.sendOverdueNotification(borrow);
        }

        console.log(`✉️ Sent ${borrows.length} overdue notifications`);
    } catch (error) {
        console.error('❌ Error sending overdue notifications:', error);
    }
};

// Run schedulers
const startSchedulers = () => {
    // Cek setiap hari jam 9 pagi WIB untuk reminder H-1
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0);
    
    // Cek setiap hari jam 7 pagi WIB untuk keterlambatan
    const overdueTime = new Date();
    overdueTime.setHours(7, 0, 0, 0);

    setInterval(sendDueDateReminders, 24 * 60 * 60 * 1000); // Every 24 hours
    setInterval(sendOverdueNotifications, 24 * 60 * 60 * 1000); // Every 24 hours

    // Run immediately
    sendDueDateReminders();
    sendOverdueNotifications();
};

module.exports = { startSchedulers }; 