const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/posters', express.static(path.join(__dirname, 'public', 'posters')));

// API Routes - /api/v1
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/movies', require('./routes/movie.routes'));
app.use('/api/v1/cinemas', require('./routes/cinema.routes'));
app.use('/api/v1/rooms', require('./routes/room.routes'));
app.use('/api/v1/seat-types', require('./routes/seatType.routes'));
app.use('/api/v1/showtimes', require('./routes/showtime.routes'));
app.use('/api/v1/bookings', require('./routes/booking.routes'));
app.use('/api/v1/promotions', require('./routes/promotion.routes'));
app.use('/api/v1/payments', require('./routes/payment.routes'));
app.use('/api/v1/tickets', require('./routes/ticket.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hệ Thống Quản Lý Rạp Chiếu Phim - API v1',
        endpoints: '/api/v1'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎬 Server running on http://localhost:${PORT}`);
    console.log(`📌 API Base: http://localhost:${PORT}/api/v1`);
});
