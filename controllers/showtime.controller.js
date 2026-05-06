const Showtime = require('../models/showtime');
const Room = require('../models/room');
const SeatLock = require('../models/seatLock');
const Ticket = require('../models/ticket');
const Booking = require('../models/booking');
const { sendSuccess, sendError } = require('../utils/response');

// GET /showtimes
exports.getShowtimes = async (req, res, next) => {
    try {
        const { movieId, cinemaId, date, roomId } = req.query;
        const query = {};

        if (movieId) query.movie = movieId;
        if (cinemaId) query.cinema = cinemaId;
        if (roomId) query.room = roomId;
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            query.startTime = { $gte: start, $lt: end };
        }

        const showtimes = await Showtime.find(query)
            .populate('movie', 'title slug posterUrl durationMinutes ageRating')
            .populate('cinema', 'name code city')
            .populate('room', 'name screenType')
            .populate('pricing.seatTypeId', 'name code')
            .sort({ startTime: 1 });

        sendSuccess(res, { showtimes });
    } catch (err) {
        next(err);
    }
};

// GET /showtimes/:showtimeId
exports.getShowtime = async (req, res, next) => {
    try {
        const showtime = await Showtime.findById(req.params.showtimeId)
            .populate('movie')
            .populate('cinema')
            .populate('room')
            .populate('pricing.seatTypeId');

        if (!showtime) return sendError(res, 'Suất chiếu không tồn tại.', 404);
        sendSuccess(res, { showtime });
    } catch (err) {
        next(err);
    }
};

// GET /showtimes/:showtimeId/seats
exports.getSeats = async (req, res, next) => {
    try {
        const showtime = await Showtime.findById(req.params.showtimeId)
            .populate('room');
        if (!showtime) return sendError(res, 'Suất chiếu không tồn tại.', 404);

        const room = await Room.findById(showtime.room._id || showtime.room)
            .populate('seatLayout.seatTypeId', 'name code baseSurcharge color');

        const now = new Date();

        // Lấy ghế đang lock
        const locks = await SeatLock.find({
            showtime: showtime._id,
            status: 'locked',
            expiresAt: { $gt: now }
        });
        const lockedSeats = new Set(locks.map(l => l.seatCode));

        // Lấy ghế đã bán
        const tickets = await Ticket.find({
            showtime: showtime._id,
            status: { $in: ['active', 'used'] }
        });
        const soldSeats = new Set(tickets.map(t => t.seatCode));

        const activeBookings = await Booking.find({
            showtime: showtime._id,
            $or: [
                { status: 'paid' },
                { status: 'pending_payment', expiresAt: { $gt: now } }
            ]
        }).select('seatCodes status');

        activeBookings.forEach((booking) => {
            booking.seatCodes.forEach((seatCode) => {
                if (booking.status === 'paid') {
                    soldSeats.add(seatCode);
                } else {
                    lockedSeats.add(seatCode);
                }
            });
        });

        // Map trạng thái từng ghế
        const seats = room.seatLayout.map(seat => {
            let status = 'available';
            if (soldSeats.has(seat.seatCode)) status = 'sold';
            else if (lockedSeats.has(seat.seatCode)) status = 'locked';
            if (!seat.isActive) status = 'inactive';

            // Tìm giá theo loại ghế
            const seatTypeId = seat.seatTypeId._id || seat.seatTypeId;
            const pricingItem = showtime.pricing.find(
                p => p.seatTypeId.toString() === seatTypeId.toString()
            );

            return {
                seatCode: seat.seatCode,
                row: seat.row,
                col: seat.col,
                seatType: seat.seatTypeId.name || seat.seatTypeId,
                zone: seat.zone,
                price: pricingItem ? pricingItem.price : 0,
                status
            };
        });

        sendSuccess(res, {
            showtimeId: showtime._id,
            roomName: room.name,
            screenType: room.screenType,
            seats
        });
    } catch (err) {
        next(err);
    }
};

// POST /showtimes (admin)
exports.createShowtime = async (req, res, next) => {
    try {
        const { movieId, cinemaId, roomId, startTime, endTime, pricing, status } = req.body;
        const showtime = await Showtime.create({
            movie: movieId,
            cinema: cinemaId,
            room: roomId,
            startTime,
            endTime,
            pricing,
            status
        });
        sendSuccess(res, { showtime }, 'Showtime created', 201);
    } catch (err) {
        next(err);
    }
};

// PUT /showtimes/:showtimeId (admin)
exports.updateShowtime = async (req, res, next) => {
    try {
        const { movieId, cinemaId, roomId, ...updateData } = req.body;
        if (movieId) updateData.movie = movieId;
        if (cinemaId) updateData.cinema = cinemaId;
        if (roomId) updateData.room = roomId;

        const showtime = await Showtime.findByIdAndUpdate(
            req.params.showtimeId,
            updateData,
            { new: true, runValidators: true }
        );
        if (!showtime) return sendError(res, 'Suất chiếu không tồn tại.', 404);
        sendSuccess(res, { showtime }, 'Showtime updated');
    } catch (err) {
        next(err);
    }
};

// DELETE /showtimes/:showtimeId (admin)
exports.deleteShowtime = async (req, res, next) => {
    try {
        const showtime = await Showtime.findByIdAndUpdate(
            req.params.showtimeId,
            { status: 'cancelled' },
            { new: true }
        );
        if (!showtime) return sendError(res, 'Suất chiếu không tồn tại.', 404);
        sendSuccess(res, { showtime }, 'Showtime cancelled');
    } catch (err) {
        next(err);
    }
};
