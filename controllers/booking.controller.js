const Booking = require('../models/booking');
const SeatLock = require('../models/seatLock');
const Showtime = require('../models/showtime');
const Room = require('../models/room');
const Ticket = require('../models/ticket');
const Promotion = require('../models/promotion');
const PromotionUsage = require('../models/promotionUsage');
const { sendSuccess, sendError } = require('../utils/response');

const canAccessBooking = (reqUser, bookingUserId) => {
    if (!reqUser) return false;
    return reqUser.role === 'admin' || bookingUserId.toString() === reqUser._id.toString();
};

const findReservedSeatCodes = async ({ showtimeId, seatCodes, ignoreBookingId = null }) => {
    const query = {
        showtime: showtimeId,
        seatCodes: { $in: seatCodes },
        $or: [
            { status: 'paid' },
            { status: 'pending_payment', expiresAt: { $gt: new Date() } }
        ]
    };

    if (ignoreBookingId) {
        query._id = { $ne: ignoreBookingId };
    }

    const [tickets, bookings] = await Promise.all([
        Ticket.find({
            showtime: showtimeId,
            seatCode: { $in: seatCodes },
            status: { $in: ['active', 'used'] }
        }).select('seatCode'),
        Booking.find(query).select('seatCodes')
    ]);

    const reservedCodes = new Set(tickets.map((ticket) => ticket.seatCode));
    bookings.forEach((booking) => {
        booking.seatCodes.forEach((seatCode) => {
            if (seatCodes.includes(seatCode)) {
                reservedCodes.add(seatCode);
            }
        });
    });

    return Array.from(reservedCodes);
};

const calculateSubtotal = async (showtimeId, seatCodes) => {
    const showtime = await Showtime.findById(showtimeId).populate('room');
    if (!showtime) {
        return { error: 'Suất chiếu không tồn tại.', statusCode: 404 };
    }

    const room = await Room.findById(showtime.room._id || showtime.room);
    let subtotal = 0;

    for (const code of seatCodes) {
        const seat = room.seatLayout.find((item) => item.seatCode === code);
        if (!seat) {
            return { error: `Ghế ${code} không tồn tại trong phòng.`, statusCode: 400 };
        }

        const seatTypeId = seat.seatTypeId.toString();
        const pricingItem = showtime.pricing.find(
            (price) => price.seatTypeId.toString() === seatTypeId
        );
        subtotal += pricingItem ? pricingItem.price : 0;
    }

    return { subtotal };
};

const validatePromotionForBooking = async ({ promotionCode, userId, subtotal, ignoreBookingId = null }) => {
    if (!promotionCode) {
        return { discountAmount: 0, promo: null };
    }

    const promo = await Promotion.findOne({
        code: promotionCode.toUpperCase(),
        status: 'active',
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
    });

    if (!promo) {
        return { error: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.', statusCode: 422 };
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        return { error: 'Mã khuyến mãi đã hết lượt sử dụng.', statusCode: 422 };
    }

    if (subtotal < promo.minOrderValue) {
        return { error: `Đơn hàng tối thiểu ${promo.minOrderValue} VND để áp dụng mã này.`, statusCode: 422 };
    }

    const usageQuery = {
        promotion: promo._id,
        user: userId
    };

    if (ignoreBookingId) {
        usageQuery.booking = { $ne: ignoreBookingId };
    }

    const userUsageCount = await PromotionUsage.countDocuments(usageQuery);
    if (promo.perUserLimit && userUsageCount >= promo.perUserLimit) {
        return { error: 'Bạn đã sử dụng hết lượt cho mã này.', statusCode: 422 };
    }

    let discountAmount = 0;
    if (promo.discountType === 'percent') {
        discountAmount = Math.round((subtotal * promo.discountValue) / 100);
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
            discountAmount = promo.maxDiscount;
        }
    } else {
        discountAmount = promo.discountValue;
    }

    return { discountAmount, promo };
};

const clearExistingPromotionUsage = async (booking) => {
    if (!booking.promotionCode) return;

    const currentPromo = await Promotion.findOne({ code: booking.promotionCode });
    if (!currentPromo) return;

    const deletedUsage = await PromotionUsage.findOneAndDelete({
        promotion: currentPromo._id,
        user: booking.user,
        booking: booking._id
    });

    if (deletedUsage) {
        await Promotion.findByIdAndUpdate(currentPromo._id, {
            $inc: { usedCount: -1 }
        });
    }
};

exports.createBooking = async (req, res, next) => {
    try {
        const { showtimeId, seatCodes, promotionCode, paymentProvider } = req.body;
        const userId = req.user._id;

        const locks = await SeatLock.find({
            showtime: showtimeId,
            seatCode: { $in: seatCodes },
            user: userId,
            status: 'locked',
            expiresAt: { $gt: new Date() }
        });

        if (locks.length !== seatCodes.length) {
            return sendError(res, 'Một hoặc nhiều ghế chưa được giữ hoặc đã hết hạn. Vui lòng giữ ghế lại.', 400);
        }

        const reservedSeatCodes = await findReservedSeatCodes({ showtimeId, seatCodes });
        if (reservedSeatCodes.length > 0) {
            return sendError(res, `Ghế đã có người đặt: ${reservedSeatCodes.join(', ')}`, 409);
        }

        const pricingResult = await calculateSubtotal(showtimeId, seatCodes);
        if (pricingResult.error) {
            return sendError(res, pricingResult.error, pricingResult.statusCode);
        }

        const { subtotal } = pricingResult;
        const promoResult = await validatePromotionForBooking({
            promotionCode,
            userId,
            subtotal
        });

        if (promoResult.error) {
            return sendError(res, promoResult.error, promoResult.statusCode);
        }

        const discountAmount = promoResult.discountAmount || 0;
        const promo = promoResult.promo;
        const totalAmount = Math.max(subtotal - discountAmount, 0);

        const booking = await Booking.create({
            user: userId,
            showtime: showtimeId,
            seatCodes,
            subtotal,
            discountAmount,
            totalAmount,
            promotionCode: promotionCode ? promotionCode.toUpperCase() : undefined,
            paymentProvider,
            status: 'pending_payment',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        if (promo) {
            await PromotionUsage.create({
                promotion: promo._id,
                user: userId,
                booking: booking._id,
                discountAmount
            });
            await Promotion.findByIdAndUpdate(promo._id, { $inc: { usedCount: 1 } });
        }

        sendSuccess(res, {
            booking,
            bookingId: booking._id,
            bookingCode: booking.bookingCode,
            subtotal,
            discountAmount,
            totalAmount,
            status: booking.status,
            expiresAt: booking.expiresAt
        }, 'Booking created', 201);
    } catch (err) {
        next(err);
    }
};

exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl durationMinutes' },
                    { path: 'cinema', select: 'name city' },
                    { path: 'room', select: 'name screenType' }
                ]
            })
            .populate('user', 'fullName email phone');

        if (!booking) return sendError(res, 'Booking không tồn tại.', 404);
        if (!canAccessBooking(req.user, booking.user._id || booking.user)) {
            return sendError(res, 'Bạn không có quyền xem booking này.', 403);
        }

        sendSuccess(res, { booking });
    } catch (err) {
        next(err);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { user: req.user._id };
        if (status) query.status = status;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        const bookings = await Booking.find(query)
            .populate({
                path: 'showtime',
                select: 'movie cinema room startTime',
                populate: [
                    { path: 'movie', select: 'title posterUrl' },
                    { path: 'cinema', select: 'name' },
                    { path: 'room', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        const total = await Booking.countDocuments(query);

        sendSuccess(res, {
            bookings,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.applyPromotion = async (req, res, next) => {
    try {
        const { promotionCode } = req.body;
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) return sendError(res, 'Booking không tồn tại.', 404);
        if (!canAccessBooking(req.user, booking.user)) {
            return sendError(res, 'Bạn không có quyền cập nhật booking này.', 403);
        }
        if (booking.status !== 'pending_payment') {
            return sendError(res, 'Chỉ có thể áp mã cho booking chưa thanh toán.', 422);
        }
        if (booking.expiresAt && booking.expiresAt <= new Date()) {
            return sendError(res, 'Booking đã hết hạn thanh toán.', 422);
        }

        const pricingResult = await calculateSubtotal(booking.showtime, booking.seatCodes);
        if (pricingResult.error) {
            return sendError(res, pricingResult.error, pricingResult.statusCode);
        }

        await clearExistingPromotionUsage(booking);

        booking.subtotal = pricingResult.subtotal;
        booking.discountAmount = 0;
        booking.totalAmount = pricingResult.subtotal;
        booking.promotionCode = undefined;

        const normalizedCode = promotionCode ? promotionCode.trim().toUpperCase() : '';
        if (normalizedCode) {
            const promoResult = await validatePromotionForBooking({
                promotionCode: normalizedCode,
                userId: booking.user,
                subtotal: pricingResult.subtotal,
                ignoreBookingId: booking._id
            });

            if (promoResult.error) {
                await booking.save();
                return sendError(res, promoResult.error, promoResult.statusCode);
            }

            booking.discountAmount = promoResult.discountAmount;
            booking.totalAmount = Math.max(pricingResult.subtotal - promoResult.discountAmount, 0);
            booking.promotionCode = normalizedCode;

            await PromotionUsage.create({
                promotion: promoResult.promo._id,
                user: booking.user,
                booking: booking._id,
                discountAmount: promoResult.discountAmount
            });
            await Promotion.findByIdAndUpdate(promoResult.promo._id, { $inc: { usedCount: 1 } });
        }

        await booking.save();
        sendSuccess(res, { booking }, normalizedCode ? 'Promotion applied' : 'Promotion removed');
    } catch (err) {
        next(err);
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) return sendError(res, 'Booking không tồn tại.', 404);
        if (!canAccessBooking(req.user, booking.user)) {
            return sendError(res, 'Bạn không có quyền hủy booking này.', 403);
        }
        if (booking.status !== 'pending_payment') {
            return sendError(res, 'Chỉ có thể hủy booking chưa thanh toán.', 422);
        }

        await clearExistingPromotionUsage(booking);

        booking.status = 'cancelled';
        await booking.save();

        await SeatLock.deleteMany({
            showtime: booking.showtime,
            seatCode: { $in: booking.seatCodes },
            user: booking.user
        });

        sendSuccess(res, { booking }, 'Booking cancelled');
    } catch (err) {
        next(err);
    }
};
