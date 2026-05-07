const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    eventType: {
        type: String,
        required: true // "webhook_received", "payment_success", "payment_failed", "refund_initiated"
    },
    rawData: {
        type: mongoose.Schema.Types.Mixed
    },
    source: {
        type: String // "momo", "vnpay", "zalopay"
    },
    receivedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
