const SeatLock = require('../models/seatLock');
const Ticket = require('../models/ticket');
const Booking = require('../models/booking');
const { sendSuccess, sendError } = require('../utils/response');

const LOCK_DURATION_MINUTES = 5;

// POST /showtimes/:showtimeId/seat-locks
exports.lockSeats = async (req, res, next) => {
    try {
        const { showtimeId } = req.params;
        const { seatCodes } = req.body;
        const userId = req.user._id;

        if (!seatCodes || seatCodes.length === 0) {
            return sendError(res, 'Vui lòng chọn ít nhất 1 ghế.', 400);
        }

        const now = new Date();

        // Kiểm tra ghế đã bán
        const soldTickets = await Ticket.find({
            showtime: showtimeId,
            seatCode: { $in: seatCodes },
            status: { $in: ['active', 'used'] }
        });
        if (soldTickets.length > 0) {
            const soldCodes = soldTickets.map(t => t.seatCode);
            return sendError(res, `Ghế đã được bán: ${soldCodes.join(', ')}`, 409);
        }

        const activeBookings = await Booking.find({
            showtime: showtimeId,
            seatCodes: { $in: seatCodes },
            $or: [
                { status: 'paid' },
                { status: 'pending_payment', expiresAt: { $gt: now } }
            ]
        }).select('seatCodes');

        if (activeBookings.length > 0) {
            const reservedCodes = new Set();
            activeBookings.forEach((booking) => {
                booking.seatCodes.forEach((seatCode) => {
                    if (seatCodes.includes(seatCode)) {
                        reservedCodes.add(seatCode);
                    }
                });
            });
            return sendError(res, `Ghế đã có người đặt: ${Array.from(reservedCodes).join(', ')}`, 409);
        }

        // Kiểm tra ghế đang bị lock bởi user khác
        const existingLocks = await SeatLock.find({
            showtime: showtimeId,
            seatCode: { $in: seatCodes },
            status: 'locked',
            expiresAt: { $gt: now },
            user: { $ne: userId }
        });
        if (existingLocks.length > 0) {
            const lockedCodes = existingLocks.map(l => l.seatCode);
            return sendError(res, `Ghế đang được giữ bởi người khác: ${lockedCodes.join(', ')}`, 409);
        }

        // Xóa lock cũ của user này cho suất chiếu này
        await SeatLock.deleteMany({
            showtime: showtimeId,
            user: userId,
            status: 'locked'
        });

        // Tạo lock mới
        const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        const locks = seatCodes.map(seatCode => ({
            showtime: showtimeId,
            seatCode,
            user: userId,
            status: 'locked',
            expiresAt
        }));

        await SeatLock.insertMany(locks);

        sendSuccess(res, {
            lockExpiresAt: expiresAt,
            seatCodes
        }, 'Seats locked successfully');
    } catch (err) {
        // Duplicate key = ghế đã bị lock
        if (err.code === 11000) {
            return sendError(res, 'Một hoặc nhiều ghế đã được giữ.', 409);
        }
        next(err);
    }
};

// DELETE /showtimes/:showtimeId/seat-locks
exports.unlockSeats = async (req, res, next) => {
    try {
        const { showtimeId } = req.params;
        const { seatCodes } = req.body;
        const userId = req.user._id;

        await SeatLock.deleteMany({
            showtime: showtimeId,
            seatCode: { $in: seatCodes },
            user: userId,
            status: 'locked'
        });

        sendSuccess(res, { seatCodes }, 'Seats unlocked successfully');
    } catch (err) {
        next(err);
    }
};
