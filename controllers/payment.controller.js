const Payment = require('../models/payment');
const PaymentEvent = require('../models/paymentEvent');
const Booking = require('../models/booking');
const SeatLock = require('../models/seatLock');
const Ticket = require('../models/ticket');
const Room = require('../models/room');
const Showtime = require('../models/showtime');
const { sendSuccess, sendError } = require('../utils/response');

const canAccessBooking = (reqUser, bookingUserId) => {
    if (!reqUser) return false;
    return reqUser.role === 'admin' || bookingUserId.toString() === reqUser._id.toString();
};

const getFrontendBaseUrl = (req) => {
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL.replace(/\/$/, '');
    }

    const host = req.get('host') || '127.0.0.1:3000';
    const frontendHost = host.replace(/:3000$/, ':5173');
    return `${req.protocol}://${frontendHost}`;
};

const redirectToCheckout = (req, res, bookingIds, paymentId, paymentStatus) => {
    const frontendBaseUrl = getFrontendBaseUrl(req);
    // If multiple bookings, just redirect to the cart or order history. But for now, just use the first bookingId or a generic success page.
    const primaryBookingId = Array.isArray(bookingIds) ? bookingIds[0] : bookingIds;
    return res.redirect(
        302,
        `${frontendBaseUrl}/checkout/${primaryBookingId}?payment=${paymentStatus}&paymentId=${paymentId}`
    );
};

const forwardError = (err, req, res, next) => {
    if (typeof next === 'function') {
        return next(err);
    }

    console.error('Payment route error:', err);
    if (res.headersSent) return undefined;
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};

const buildSeatConflictError = (seatCodes) => {
    const err = new Error(`Ghe da co nguoi dat: ${seatCodes.join(', ')}`);
    err.statusCode = 409;
    return err;
};

const findConflictingSeatCodes = async ({ booking }) => {
    const seatCodes = booking.seatCodes || [];
    const [tickets, bookings] = await Promise.all([
        Ticket.find({
            showtime: booking.showtime,
            seatCode: { $in: seatCodes },
            status: { $in: ['active', 'used'] },
            booking: { $ne: booking._id }
        }).select('seatCode'),
        Booking.find({
            _id: { $ne: booking._id },
            showtime: booking.showtime,
            seatCodes: { $in: seatCodes },
            $or: [
                { status: 'paid' },
                { status: 'pending_payment', expiresAt: { $gt: new Date() } }
            ]
        }).select('seatCodes')
    ]);

    const conflictingSeatCodes = new Set(tickets.map((ticket) => ticket.seatCode));
    bookings.forEach((existingBooking) => {
        existingBooking.seatCodes.forEach((seatCode) => {
            if (seatCodes.includes(seatCode)) {
                conflictingSeatCodes.add(seatCode);
            }
        });
    });

    return Array.from(conflictingSeatCodes);
};

const handlePaymentSuccess = async (payment) => {
    const bookings = await Booking.find({ _id: { $in: payment.bookings } });
    if (bookings.length === 0) {
        const err = new Error('Bookings khong ton tai.');
        err.statusCode = 404;
        throw err;
    }

    // Check all bookings before updating any
    for (const booking of bookings) {
        if (booking.status === 'pending_payment' && booking.expiresAt && booking.expiresAt <= new Date()) {
            booking.status = 'expired';
            await booking.save();
            await SeatLock.deleteMany({
                showtime: booking.showtime,
                seatCode: { $in: booking.seatCodes },
                user: booking.user
            });
            const err = new Error('Mot trong cac Booking da het han thanh toan.');
            err.statusCode = 422;
            throw err;
        }

        const conflictingSeatCodes = await findConflictingSeatCodes({ booking });
        if (conflictingSeatCodes.length > 0) {
            throw buildSeatConflictError(conflictingSeatCodes);
        }
    }

    if (payment.status !== 'completed') {
        payment.status = 'completed';
        payment.paidAt = new Date();
        await payment.save();
    }

    // Process all bookings
    for (const booking of bookings) {
        if (booking.status !== 'paid') {
            booking.status = 'paid';
            await booking.save();
        }

        const showtime = await Showtime.findById(booking.showtime);
        if (!showtime) continue;

        const room = await Room.findById(showtime.room);
        if (!room) continue;

        const existingTickets = await Ticket.find({ booking: booking._id }).select('seatCode');
        const issuedSeatCodes = new Set(existingTickets.map((ticket) => ticket.seatCode));

        for (const seatCode of booking.seatCodes) {
            if (issuedSeatCodes.has(seatCode)) continue;

            const seat = room.seatLayout.find((item) => item.seatCode === seatCode);
            if (!seat) continue;

            const pricingItem = showtime.pricing.find(
                (price) => price.seatTypeId.toString() === seat.seatTypeId.toString()
            );

            await Ticket.create({
                booking: booking._id,
                showtime: booking.showtime,
                seatCode,
                seatType: seat.seatTypeId,
                price: pricingItem ? pricingItem.price : 0
            });
        }

        await SeatLock.updateMany(
            {
                showtime: booking.showtime,
                seatCode: { $in: booking.seatCodes },
                user: booking.user
            },
            { status: 'converted' }
        );
    }
};

exports.createPayment = async (req, res, next) => {
    try {
        const { bookingId, bookingIds: inputBookingIds, provider } = req.body;
        const bookingIds = inputBookingIds || (bookingId ? [bookingId] : []);

        if (bookingIds.length === 0) {
            return sendError(res, 'Vui long cung cap bookingId hoac bookingIds.', 400);
        }

        const bookings = await Booking.find({ _id: { $in: bookingIds } });
        if (bookings.length !== bookingIds.length) {
            return sendError(res, 'Mot hoac nhieu Booking khong ton tai.', 404);
        }

        let totalAmount = 0;
        for (const booking of bookings) {
            if (!canAccessBooking(req.user, booking.user)) {
                return sendError(res, 'Ban khong co quyen thanh toan mot trong cac booking nay.', 403);
            }
            if (!provider) {
                return sendError(res, 'Vui long chon phuong thuc thanh toan.', 400);
            }
            if (booking.status !== 'pending_payment') {
                return sendError(res, 'Mot hoac nhieu Booking khong o trang thai cho thanh toan.', 422);
            }
            if (booking.expiresAt && booking.expiresAt <= new Date()) {
                booking.status = 'expired';
                await booking.save();
                await SeatLock.deleteMany({
                    showtime: booking.showtime,
                    seatCode: { $in: booking.seatCodes },
                    user: booking.user
                });
                return sendError(res, 'Mot hoac nhieu Booking da het han thanh toan.', 422);
            }

            const conflictingSeatCodes = await findConflictingSeatCodes({ booking });
            if (conflictingSeatCodes.length > 0) {
                return sendError(res, `Ghe da co nguoi dat: ${conflictingSeatCodes.join(', ')}`, 409);
            }

            totalAmount += booking.totalAmount;
        }

        const existingPendingPayment = await Payment.findOne({
            bookings: { $all: bookingIds, $size: bookingIds.length },
            provider,
            status: 'pending'
        }).sort({ createdAt: -1 });

        if (existingPendingPayment) {
            return sendSuccess(res, {
                payment: existingPendingPayment,
                paymentId: existingPendingPayment._id,
                provider: existingPendingPayment.provider,
                paymentUrl: existingPendingPayment.paymentUrl
            }, 'Reused pending payment');
        }

        const payment = await Payment.create({
            bookings: bookingIds,
            provider,
            amount: totalAmount,
            status: 'pending'
        });

        const appBaseUrl = `${req.protocol}://${req.get('host')}`;
        let paymentUrl = '';
        if (['vnpay', 'momo', 'zalopay'].includes(provider)) {
            paymentUrl = `${appBaseUrl}/api/v1/payments/mock-gateway/${payment._id}?provider=${provider}`;
        }

        payment.paymentUrl = paymentUrl;
        await payment.save();

        sendSuccess(res, {
            payment,
            paymentId: payment._id,
            provider: payment.provider,
            paymentUrl: payment.paymentUrl
        }, 'Payment created', 201);
    } catch (err) {
        forwardError(err, req, res, next);
    }
};

exports.getPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.paymentId).populate('bookings');
        if (!payment) return sendError(res, 'Payment khong ton tai.', 404);
        
        const firstBooking = payment.bookings && payment.bookings[0];
        if (firstBooking && !canAccessBooking(req.user, firstBooking.user)) {
            return sendError(res, 'Ban khong co quyen xem giao dich nay.', 403);
        }
        sendSuccess(res, { payment });
    } catch (err) {
        forwardError(err, req, res, next);
    }
};

exports.getPaymentByBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) return sendError(res, 'Booking khong ton tai.', 404);
        if (!canAccessBooking(req.user, booking.user)) {
            return sendError(res, 'Ban khong co quyen xem giao dich cho booking nay.', 403);
        }

        const payments = await Payment.find({ bookings: { $in: [req.params.bookingId] } }).sort({ createdAt: -1 });
        sendSuccess(res, { payments });
    } catch (err) {
        forwardError(err, req, res, next);
    }
};

exports.webhook = async (req, res, next) => {
    try {
        const { provider } = req.params;
        const rawData = req.body;
        const paymentId = rawData.orderId || rawData.paymentId || rawData.requestId;
        const resultCode = rawData.resultCode || rawData.vnp_ResponseCode;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return sendError(res, 'Payment not found', 404);
        }

        await PaymentEvent.create({
            payment: payment._id,
            eventType: `webhook_${provider}`,
            rawData,
            source: provider
        });

        const isSuccess = resultCode === '00' || resultCode === 0 || resultCode === '0';
        if (isSuccess) {
            payment.transactionId = rawData.transactionId || rawData.vnp_TransactionNo;
            await handlePaymentSuccess(payment);
        } else {
            payment.status = 'failed';
            await payment.save();

            const bookings = await Booking.find({ _id: { $in: payment.bookings } });
            for (const booking of bookings) {
                booking.status = 'cancelled';
                await booking.save();
                await SeatLock.deleteMany({
                    showtime: booking.showtime,
                    seatCode: { $in: booking.seatCodes },
                    user: booking.user
                });
            }
        }

        res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (err) {
        forwardError(err, req, res, next);
    }
};

exports.paymentReturn = async (req, res, next) => {
    try {
        const paymentId = req.query.orderId || req.query.vnp_TxnRef;
        if (!paymentId) {
            return sendError(res, 'Missing payment reference', 400);
        }

        const payment = await Payment.findById(paymentId).populate('bookings');
        if (!payment) {
            return sendError(res, 'Payment not found', 404);
        }

        const primaryBooking = payment.bookings && payment.bookings.length > 0 ? payment.bookings[0] : null;

        sendSuccess(res, {
            paymentId: payment._id,
            status: payment.status,
            bookingId: primaryBooking ? primaryBooking._id : null,
            bookingCode: primaryBooking ? primaryBooking.bookingCode : null
        }, 'Payment return processed');
    } catch (err) {
        forwardError(err, req, res, next);
    }
};

exports.mockGateway = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.paymentId).populate('bookings');
        if (!payment) return sendError(res, 'Payment khong ton tai.', 404);

        if (payment.status === 'completed') {
            await handlePaymentSuccess(payment);
            return redirectToCheckout(req, res, payment.bookings.map(b => b._id), payment._id, 'success');
        }

        if (payment.status !== 'pending') {
            return redirectToCheckout(req, res, payment.bookings.map(b => b._id), payment._id, 'failed');
        }

        payment.transactionId = `MOCK_${Date.now()}`;
        await handlePaymentSuccess(payment);

        await PaymentEvent.create({
            payment: payment._id,
            eventType: 'mock_gateway_success',
            rawData: { provider: payment.provider, mode: 'mock_gateway' },
            source: 'mock_gateway'
        });

        return redirectToCheckout(req, res, payment.bookings.map(b => b._id), payment._id, 'success');
    } catch (err) {
        return forwardError(err, req, res, next);
    }
};

exports.simulateSuccess = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.paymentId).populate('bookings');
        if (!payment) return sendError(res, 'Payment khong ton tai.', 404);
        
        const firstBooking = payment.bookings && payment.bookings[0];
        if (firstBooking && !canAccessBooking(req.user, firstBooking.user)) {
            return sendError(res, 'Ban khong co quyen thao tac giao dich nay.', 403);
        }
        if (payment.status !== 'pending') {
            return sendError(res, 'Payment khong o trang thai pending.', 422);
        }

        payment.transactionId = `SIM_${Date.now()}`;
        await handlePaymentSuccess(payment);

        await PaymentEvent.create({
            payment: payment._id,
            eventType: 'simulated_success',
            rawData: { note: 'DEV simulated payment' },
            source: 'simulator'
        });

        const primaryBooking = payment.bookings && payment.bookings.length > 0 ? await Booking.findById(payment.bookings[0]._id) : null;
        sendSuccess(res, {
            paymentId: payment._id,
            status: 'completed',
            bookingStatus: primaryBooking ? primaryBooking.status : 'paid',
            bookingCode: primaryBooking ? primaryBooking.bookingCode : 'MULTI'
        }, 'Payment simulated successfully');
    } catch (err) {
        forwardError(err, req, res, next);
    }
};
