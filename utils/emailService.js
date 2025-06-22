const nodemailer = require('nodemailer');
const { getCurrentWIB } = require('./timeHelper');

// Format date to Indonesian format
exports.formatDate = (date) => {
    if (!date) return '';
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    };
    return date.toLocaleDateString('id-ID', options);
};

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send new borrow notification to admin
exports.sendNewBorrowNotification = async (borrow) => {
    try {
        const itemList = borrow.items.map(item => 
            `<li>${item.item.name} (${item.item.code}) - Kondisi: ${item.condition}${item.notes ? ` - Catatan: ${item.notes}` : ''}</li>`
        ).join('');

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: process.env.ADMIN_EMAIL,
            subject: `Permintaan Peminjaman Baru - ${borrow.user.name}`,
            html: `
                <h2>Permintaan Peminjaman Baru</h2>
                <p><strong>Peminjam:</strong> ${borrow.user.name} (${borrow.user.class})</p>
                <p><strong>Email:</strong> ${borrow.user.email}</p>
                <p><strong>Tujuan:</strong> ${borrow.purpose}</p>
                <p><strong>Tanggal Peminjaman:</strong> ${this.formatDate(borrow.borrowDate)}</p>
                <p><strong>Tanggal Pengembalian:</strong> ${this.formatDate(borrow.dueDate)}</p>
                <h3>Daftar Barang:</h3>
                <ul>
                    ${itemList}
                </ul>
                <p>Silakan cek sistem untuk menyetujui atau menolak permintaan ini.</p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Send borrow status update notification to user
exports.sendStatusUpdateNotification = async (borrow) => {
    try {
        const itemList = borrow.items.map(item => 
            `<li>${item.item.name} (${item.item.code})</li>`
        ).join('');

        const statusMessages = {
            'Pending': 'sedang menunggu persetujuan admin',
            'Approved': 'telah disetujui',
            'Rejected': 'telah ditolak',
            'Returned': 'telah dikembalikan'
        };

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: borrow.user.email,
            subject: `Status Peminjaman - ${statusMessages[borrow.status]}`,
            html: `
                <h2>Update Status Peminjaman</h2>
                <p>Peminjaman Anda ${statusMessages[borrow.status]}.</p>
                <p><strong>Tujuan:</strong> ${borrow.purpose}</p>
                <p><strong>Tanggal Peminjaman:</strong> ${this.formatDate(borrow.borrowDate)}</p>
                <p><strong>Tanggal Pengembalian:</strong> ${this.formatDate(borrow.dueDate)}</p>
                <h3>Daftar Barang:</h3>
                <ul>
                    ${itemList}
                </ul>
                ${borrow.status === 'Rejected' && borrow.rejectionReason ? 
                    `<p><strong>Alasan Penolakan:</strong> ${borrow.rejectionReason}</p>` : ''}
                ${borrow.status === 'Approved' ? 
                    `<p>Silakan ambil barang di Laboratorium RPL sesuai jadwal yang telah ditentukan.</p>` : ''}
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Send due date reminder
exports.sendDueDateReminder = async (borrow) => {
    try {
        const itemList = borrow.items.map(item => 
            `<li>${item.item.name} (${item.item.code})</li>`
        ).join('');

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: borrow.user.email,
            subject: 'Pengingat Pengembalian Barang',
            html: `
                <h2>Pengingat Pengembalian Barang</h2>
                <p>Halo ${borrow.user.name},</p>
                <p>Ini adalah pengingat bahwa peminjaman Anda akan berakhir besok.</p>
                <p><strong>Tanggal Pengembalian:</strong> ${this.formatDate(borrow.dueDate)}</p>
                <h3>Daftar Barang:</h3>
                <ul>
                    ${itemList}
                </ul>
                <p>Mohon mengembalikan barang tepat waktu ke Laboratorium RPL.</p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Send overdue notification
exports.sendOverdueNotification = async (borrow) => {
    try {
        const itemList = borrow.items.map(item => 
            `<li>${item.item.name} (${item.item.code})</li>`
        ).join('');

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: borrow.user.email,
            subject: 'Pemberitahuan Keterlambatan Pengembalian',
            html: `
                <h2>Pemberitahuan Keterlambatan</h2>
                <p>Halo ${borrow.user.name},</p>
                <p>Peminjaman Anda telah melewati batas waktu pengembalian.</p>
                <p><strong>Tanggal Seharusnya:</strong> ${this.formatDate(borrow.dueDate)}</p>
                <h3>Daftar Barang:</h3>
                <ul>
                    ${itemList}
                </ul>
                <p>Mohon segera mengembalikan barang ke Laboratorium RPL untuk menghindari sanksi.</p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}; 