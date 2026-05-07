const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    showtime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true
    },
    seatCode: {
        type: String,
        required: true
    },
    seatType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SeatType',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    qrCode: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ['active', 'used', 'cancelled', 'expired'],
        default: 'active'
    },
    checkedInAt: {
        type: Date
    },
    checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Tự tạo QR code unique
ticketSchema.pre('save', function () {
    if (!this.qrCode) {
        this.qrCode = `TK_${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
    }
});

ticketSchema.index({ showtime: 1, seatCode: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
