const Ticket = require('../models/ticket');
const Booking = require('../models/booking');
const { sendSuccess, sendError } = require('../utils/response');

const canAccessBookingTickets = (reqUser, bookingUserId) => {
    if (!reqUser) return false;
    return reqUser.role === 'admin' || bookingUserId.toString() === reqUser._id.toString();
};

// GET /tickets/:ticketId
exports.getTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId)
            .populate({
                path: 'booking',
                select: 'bookingCode status user'
            })
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl durationMinutes' },
                    { path: 'cinema', select: 'name city' },
                    { path: 'room', select: 'name screenType' }
                ]
            })
            .populate('seatType', 'name code');

        if (!ticket) return sendError(res, 'Vé không tồn tại.', 404);
        if (!canAccessBookingTickets(req.user, ticket.booking?.user)) {
            return sendError(res, 'Bạn không có quyền xem vé này.', 403);
        }

        sendSuccess(res, { ticket });
    } catch (err) {
        next(err);
    }
};

// GET /tickets/booking/:bookingId
exports.getTicketsByBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId).select('user');

        if (!booking) return sendError(res, 'Booking không tồn tại.', 404);
        if (!canAccessBookingTickets(req.user, booking.user)) {
            return sendError(res, 'Bạn không có quyền xem danh sách vé của booking này.', 403);
        }

        const tickets = await Ticket.find({ booking: req.params.bookingId })
            .populate('seatType', 'name code')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'cinema', select: 'name' },
                    { path: 'room', select: 'name' }
                ]
            })
            .sort({ seatCode: 1 });

        sendSuccess(res, { tickets });
    } catch (err) {
        next(err);
    }
};

// POST /tickets/:ticketId/check-in
exports.checkIn = async (req, res, next) => {
    try {
        const { qrCode } = req.body;

        let ticket;
        if (qrCode) {
            ticket = await Ticket.findOne({ qrCode })
                .populate({
                    path: 'showtime',
                    populate: [
                        { path: 'movie', select: 'title' },
                        { path: 'room', select: 'name' }
                    ]
                });
        } else {
            ticket = await Ticket.findById(req.params.ticketId)
                .populate({
                    path: 'showtime',
                    populate: [
                        { path: 'movie', select: 'title' },
                        { path: 'room', select: 'name' }
                    ]
                });
        }

        if (!ticket) return sendError(res, 'Vé không tồn tại.', 404);

        if (ticket.status === 'used') {
            return sendError(res, 'Vé đã được sử dụng.', 422);
        }
        if (ticket.status === 'cancelled') {
            return sendError(res, 'Vé đã bị hủy.', 422);
        }

        ticket.status = 'used';
        ticket.checkedInAt = new Date();
        ticket.checkedInBy = req.user._id;
        await ticket.save();

        sendSuccess(res, { ticket }, 'Check-in successful');
    } catch (err) {
        next(err);
    }
};
