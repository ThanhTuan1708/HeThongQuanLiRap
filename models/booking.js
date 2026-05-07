const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    showtime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true
    },
    seatCodes: [{
        type: String // ["A1", "A2"]
    }],
    bookingCode: {
        type: String,
        unique: true
    },
    subtotal: {
        type: Number, // Tổng tiền trước giảm
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number, // Tổng tiền sau giảm = subtotal - discountAmount
        required: true
    },
    promotionCode: {
        type: String
    },
    paymentProvider: {
        type: String,
        enum: ['cash', 'momo', 'vnpay', 'zalopay', 'credit_card', 'bank_transfer']
    },
    status: {
        type: String,
        enum: ['pending_payment', 'paid', 'cancelled', 'expired'],
        default: 'pending_payment'
    },
    expiresAt: {
        type: Date // Booking hết hạn nếu chưa thanh toán
    }
}, {
    timestamps: true
});

// Tự tạo booking code
bookingSchema.pre('save', async function () {
    if (!this.bookingCode) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.bookingCode = `BK${date}${random}`;
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
