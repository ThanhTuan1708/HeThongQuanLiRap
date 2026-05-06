const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Tên rạp là bắt buộc']
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    timezone: {
        type: String,
        default: 'Asia/Ho_Chi_Minh'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    }
}, {
    timestamps: true
});

cinemaSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Cinema', cinemaSchema);
