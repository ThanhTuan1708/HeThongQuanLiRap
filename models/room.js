const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatCode: { type: String, required: true },  // "A1", "B5"
    row: { type: String, required: true },        // "A", "B"
    col: { type: Number, required: true },        // 1, 2, 3...
    seatTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatType', required: true },
    zone: { type: String, default: 'standard' },  // "standard", "vip", "sweetbox"
    isActive: { type: Boolean, default: true }
}, { _id: false });

const roomSchema = new mongoose.Schema({
    cinema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cinema',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Tên phòng là bắt buộc']
    },
    screenType: {
        type: String,
        enum: ['2D', '3D', 'IMAX', '4DX'],
        default: '2D'
    },
    seatLayout: [seatSchema],
    totalSeats: {
        type: Number
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Tự tính totalSeats từ seatLayout
roomSchema.pre('save', async function () {
    if (this.seatLayout && Array.isArray(this.seatLayout)) {
        this.totalSeats = this.seatLayout.filter(s => s.isActive).length;
    } else {
        this.totalSeats = 0;
    }
});

module.exports = mongoose.model('Room', roomSchema);
