// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const borrowRoutes = require('./routes/borrowRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Optional

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('🚀 Server is running');
});

// Auth routes
app.use('/api/auth', authRoutes);

// Item routes
app.use('/api/items', itemRoutes);

// Borrow routes
app.use('/api/borrows', borrowRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
});

// Handle unhandled routes
app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
