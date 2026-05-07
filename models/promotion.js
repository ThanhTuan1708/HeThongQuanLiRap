const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['coupon', 'voucher', 'system'],
        default: 'coupon'
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Tên khuyến mãi là bắt buộc']
    },
    description: {
        type: String
    },
    discountType: {
        type: String,
        enum: ['percent', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number // Giảm tối đa (cho loại percent)
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number, // Tổng số lần dùng
        default: null
    },
    perUserLimit: {
        type: Number, // Mỗi user dùng tối đa bao nhiêu lần
        default: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    applicableScope: {
        movieIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
        cinemaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cinema' }],
        seatTypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeatType' }]
    },
    isStackable: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);
