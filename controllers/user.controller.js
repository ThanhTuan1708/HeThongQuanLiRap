const User = require('../models/user');
const Booking = require('../models/booking');
const { sendSuccess, sendError } = require('../utils/response');

// GET /users/profile
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        sendSuccess(res, { user });
    } catch (err) {
        next(err);
    }
};

// PUT /users/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { fullName, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { fullName, phone },
            { new: true, runValidators: true }
        );
        sendSuccess(res, { user }, 'Profile updated');
    } catch (err) {
        next(err);
    }
};

// GET /users/bookings
exports.getUserBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { user: req.user._id };
        if (status) query.status = status;

        const bookings = await Booking.find(query)
            .populate('showtime')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        sendSuccess(res, {
            bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
};
