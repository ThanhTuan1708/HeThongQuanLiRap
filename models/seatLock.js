const mongoose = require('mongoose');

const seatLockSchema = new mongoose.Schema({
    showtime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true
    },
    seatCode: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['locked', 'converted', 'released'],
        default: 'locked'
    },
    lockedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// TTL: tự động xóa lock khi hết hạn
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 1 ghế chỉ lock 1 lần cho 1 suất chiếu
seatLockSchema.index({ showtime: 1, seatCode: 1 }, { unique: true });

module.exports = mongoose.model('SeatLock', seatLockSchema);
