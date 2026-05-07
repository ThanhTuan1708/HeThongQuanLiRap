const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    }],
    provider: {
        type: String,
        enum: ['cash', 'momo', 'vnpay', 'zalopay', 'credit_card', 'bank_transfer'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    paymentUrl: {
        type: String // URL redirect đến cổng thanh toán
    },
    paidAt: {
        type: Date
    },
    rawResponse: {
        type: mongoose.Schema.Types.Mixed // Response gốc từ gateway
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
