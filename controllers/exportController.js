const Excel = require('exceljs');
const PDFDocument = require('pdfkit');
const Item = require('../models/itemModel');
const Borrow = require('../models/borrowModel');
const { getCurrentWIB } = require('../utils/timeHelper');

// Helper untuk format currency
const formatCurrency = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(number);
};

// Helper untuk format tanggal
const formatDate = (date) => {
    return new Date(date).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'short'
    });
};

// Export items ke Excel
exports.exportItemsToExcel = async (req, res) => {
    try {
        const items = await Item.find().populate('createdBy', 'name');
        
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Inventory Items');

        // Set columns
        worksheet.columns = [
            { header: 'Kode', key: 'code', width: 12 },
            { header: 'Nama Barang', key: 'name', width: 30 },
            { header: 'Kategori', key: 'category', width: 15 },
            { header: 'Kondisi', key: 'condition', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Lokasi', key: 'location', width: 12 },
            { header: 'Harga', key: 'price', width: 20 },
            { header: 'Tanggal Pembelian', key: 'purchaseDate', width: 20 },
            { header: 'Garansi', key: 'warranty', width: 20 },
            { header: 'Dibuat Oleh', key: 'createdBy', width: 20 },
            { header: 'Catatan', key: 'notes', width: 30 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Add data
        items.forEach(item => {
            worksheet.addRow({
                code: item.code,
                name: item.name,
                category: item.category,
                condition: item.condition,
                status: item.status,
                location: item.location,
                price: formatCurrency(item.purchaseInfo.price),
                purchaseDate: formatDate(item.purchaseInfo.date),
                warranty: formatDate(item.purchaseInfo.warranty),
                createdBy: item.createdBy?.name || 'System',
                notes: item.notes
            });
        });

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Inventory_${getCurrentWIB().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Export peminjaman ke Excel
exports.exportBorrowsToExcel = async (req, res) => {
    try {
        const borrows = await Borrow.find()
            .populate('user', 'name email class')
            .populate('items.item', 'name code category');

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Peminjaman');

        // Set columns
        worksheet.columns = [
            { header: 'Kode Pinjam', key: 'code', width: 15 },
            { header: 'Peminjam', key: 'user', width: 20 },
            { header: 'Kelas', key: 'class', width: 12 },
            { header: 'Barang', key: 'items', width: 40 },
            { header: 'Tanggal Pinjam', key: 'borrowDate', width: 20 },
            { header: 'Tenggat', key: 'dueDate', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Tanggal Kembali', key: 'returnDate', width: 20 },
            { header: 'Kondisi Kembali', key: 'returnCondition', width: 15 },
            { header: 'Catatan', key: 'notes', width: 30 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Add data
        borrows.forEach(borrow => {
            worksheet.addRow({
                code: borrow.borrowCode,
                user: borrow.user.name,
                class: borrow.user.class,
                items: borrow.items.map(i => i.item.name).join(', '),
                borrowDate: formatDate(borrow.borrowDate),
                dueDate: formatDate(borrow.dueDate),
                status: borrow.status,
                returnDate: borrow.returnDate ? formatDate(borrow.returnDate) : '-',
                returnCondition: borrow.returnCondition || '-',
                notes: borrow.returnNotes || borrow.items.map(i => i.notes).filter(Boolean).join(', ') || '-'
            });
        });

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Peminjaman_${getCurrentWIB().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Export items ke PDF
exports.exportItemsToPDF = async (req, res) => {
    try {
        const items = await Item.find().populate('createdBy', 'name');
        
        // Create PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Inventory_${getCurrentWIB().toISOString().split('T')[0]}.pdf`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Add title
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('Laporan Inventaris RPL', { align: 'center' })
            .moveDown();

        // Add date
        doc.fontSize(12)
            .font('Helvetica')
            .text(`Dicetak pada: ${formatDate(getCurrentWIB())}`, { align: 'right' })
            .moveDown();

        // Add items table
        let yPos = 150;
        const itemsPerPage = 15;
        let itemCount = 0;

        // Table headers
        const addTableHeaders = () => {
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .text('Kode', 50, yPos)
                .text('Nama Barang', 120, yPos)
                .text('Kategori', 300, yPos)
                .text('Kondisi', 380, yPos)
                .text('Status', 450, yPos)
                .moveDown();
            yPos += 20;
        };

        addTableHeaders();

        // Add items
        items.forEach((item, index) => {
            if (itemCount === itemsPerPage) {
                doc.addPage();
                yPos = 50;
                addTableHeaders();
                itemCount = 0;
            }

            doc.font('Helvetica')
                .fontSize(10)
                .text(item.code, 50, yPos)
                .text(item.name.substring(0, 25), 120, yPos)
                .text(item.category, 300, yPos)
                .text(item.condition, 380, yPos)
                .text(item.status, 450, yPos);

            yPos += 20;
            itemCount++;
        });

        // Add summary
        doc.moveDown()
            .fontSize(12)
            .text(`Total Items: ${items.length}`, { align: 'right' });

        // Finalize PDF
        doc.end();
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// Export peminjaman ke PDF
exports.exportBorrowsToPDF = async (req, res) => {
    try {
        const borrows = await Borrow.find()
            .populate('user', 'name email class')
            .populate('items.item', 'name code');

        // Create PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Peminjaman_${getCurrentWIB().toISOString().split('T')[0]}.pdf`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Add title
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('Laporan Peminjaman Inventaris RPL', { align: 'center' })
            .moveDown();

        // Add date
        doc.fontSize(12)
            .font('Helvetica')
            .text(`Dicetak pada: ${formatDate(getCurrentWIB())}`, { align: 'right' })
            .moveDown();

        // Add borrows table
        let yPos = 150;
        const borrowsPerPage = 12;
        let borrowCount = 0;

        // Table headers
        const addTableHeaders = () => {
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .text('Kode', 50, yPos)
                .text('Peminjam', 120, yPos)
                .text('Barang', 220, yPos)
                .text('Status', 400, yPos)
                .text('Tenggat', 460, yPos)
                .moveDown();
            yPos += 20;
        };

        addTableHeaders();

        // Add borrows
        borrows.forEach((borrow, index) => {
            if (borrowCount === borrowsPerPage) {
                doc.addPage();
                yPos = 50;
                addTableHeaders();
                borrowCount = 0;
            }

            doc.font('Helvetica')
                .fontSize(10)
                .text(borrow.borrowCode, 50, yPos)
                .text(borrow.user.name, 120, yPos)
                .text(borrow.items.map(i => i.item.name).join(', ').substring(0, 25), 220, yPos)
                .text(borrow.status, 400, yPos)
                .text(formatDate(borrow.dueDate).split(',')[0], 460, yPos);

            yPos += 20;
            borrowCount++;
        });

        // Add summary
        doc.moveDown()
            .fontSize(12)
            .text(`Total Peminjaman: ${borrows.length}`, { align: 'right' });

        // Finalize PDF
        doc.end();
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}; 