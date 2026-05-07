const mongoose = require('mongoose');

const promotionUsageSchema = new mongoose.Schema({
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    usedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

promotionUsageSchema.index({ promotion: 1, user: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model('PromotionUsage', promotionUsageSchema);
