const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
    seatTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatType', required: true },
    price: { type: Number, required: true }
}, { _id: false });

const showtimeSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    cinema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cinema',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    pricing: [pricingSchema], // Giá vé theo loại ghế
    status: {
        type: String,
        enum: ['open', 'now_playing', 'finished', 'cancelled'],
        default: 'open'
    }
}, {
    timestamps: true
});

showtimeSchema.index({ movie: 1, cinema: 1, startTime: 1 });

module.exports = mongoose.model('Showtime', showtimeSchema);
