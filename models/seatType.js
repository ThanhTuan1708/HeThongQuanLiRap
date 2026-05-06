const mongoose = require('mongoose');

const seatTypeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true // "NORMAL", "VIP", "SWEETBOX"
    },
    name: {
        type: String,
        required: [true, 'Tên loại ghế là bắt buộc']
    },
    description: {
        type: String
    },
    baseSurcharge: {
        type: Number, // Phụ thu thêm so với giá gốc (VND)
        default: 0
    },
    features: [{
        type: String // ["wide-seat", "usb-charger", "couple"]
    }],
    color: {
        type: String // Màu hiển thị trên sơ đồ
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SeatType', seatTypeSchema);
