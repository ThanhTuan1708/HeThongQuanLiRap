const Movie = require('../models/movie');
const Showtime = require('../models/showtime');
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Ticket = require('../models/ticket');
const { sendSuccess } = require('../utils/response');

// GET /admin/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const [movieCount, showtimeCount, bookingCount, ticketCount] = await Promise.all([
            Movie.countDocuments({ status: { $ne: 'ended' } }),
            Showtime.countDocuments({ status: { $in: ['open', 'now_playing'] } }),
            Booking.countDocuments({ status: 'paid' }),
            Ticket.countDocuments({ status: { $in: ['active', 'used'] } })
        ]);

        // Doanh thu tổng
        const revenueResult = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // Doanh thu hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRevenueResult = await Payment.aggregate([
            { $match: { status: 'completed', paidAt: { $gte: today } } },
            { $group: { _id: null, revenue: { $sum: '$amount' } } }
        ]);
        const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].revenue : 0;

        sendSuccess(res, {
            stats: {
                movies: movieCount,
                showtimes: showtimeCount,
                bookings: bookingCount,
                tickets: ticketCount,
                totalRevenue,
                todayRevenue
            }
        });
    } catch (err) {
        next(err);
    }
};

// GET /admin/bookings
exports.getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, cinemaId, dateFrom, dateTo } = req.query;
        const query = {};

        if (status) query.status = status;
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        let bookings = Booking.find(query)
            .populate('user', 'fullName email phone')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'cinema', select: 'name code' },
                    { path: 'room', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Filter by cinemaId (needs populate first)
        const results = await bookings;
        const filtered = cinemaId
            ? results.filter(b => b.showtime && b.showtime.cinema &&
                b.showtime.cinema._id.toString() === cinemaId)
            : results;

        const total = await Booking.countDocuments(query);

        sendSuccess(res, {
            bookings: filtered,
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

// GET /admin/payments
exports.getAllPayments = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, provider } = req.query;
        const query = {};
        if (status) query.status = status;
        if (provider) query.provider = provider;

        const payments = await Payment.find(query)
            .populate({
                path: 'booking',
                select: 'bookingCode seatCodes totalAmount',
                populate: { path: 'user', select: 'fullName email' }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        sendSuccess(res, {
            payments,
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

// GET /admin/revenue
exports.getRevenue = async (req, res, next) => {
    try {
        const { cinemaId, dateFrom, dateTo, groupBy = 'day' } = req.query;

        const matchStage = { status: 'completed' };
        if (dateFrom || dateTo) {
            matchStage.paidAt = {};
            if (dateFrom) matchStage.paidAt.$gte = new Date(dateFrom);
            if (dateTo) matchStage.paidAt.$lte = new Date(dateTo);
        }

        let dateFormat;
        switch (groupBy) {
            case 'month': dateFormat = '%Y-%m'; break;
            case 'week': dateFormat = '%Y-W%V'; break;
            default: dateFormat = '%Y-%m-%d';
        }

        const revenue = await Payment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$paidAt' } },
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        sendSuccess(res, { revenue, groupBy });
    } catch (err) {
        next(err);
    }
};

// GET /admin/showtimes/report
exports.getShowtimeReport = async (req, res, next) => {
    try {
        const { cinemaId, dateFrom, dateTo } = req.query;
        const query = {};
        if (cinemaId) query.cinema = cinemaId;
        if (dateFrom || dateTo) {
            query.startTime = {};
            if (dateFrom) query.startTime.$gte = new Date(dateFrom);
            if (dateTo) query.startTime.$lte = new Date(dateTo);
        }

        const showtimes = await Showtime.find(query)
            .populate('movie', 'title')
            .populate('cinema', 'name')
            .populate('room', 'name totalSeats')
            .sort({ startTime: -1 })
            .limit(100);

        // Tính số ghế đã bán cho mỗi suất
        const report = await Promise.all(showtimes.map(async (st) => {
            const ticketsSold = await Ticket.countDocuments({
                showtime: st._id,
                status: { $in: ['active', 'used'] }
            });
            const totalSeats = st.room ? st.room.totalSeats || 0 : 0;
            return {
                showtimeId: st._id,
                movie: st.movie ? st.movie.title : 'N/A',
                cinema: st.cinema ? st.cinema.name : 'N/A',
                room: st.room ? st.room.name : 'N/A',
                startTime: st.startTime,
                totalSeats,
                ticketsSold,
                occupancyRate: totalSeats > 0
                    ? Math.round((ticketsSold / totalSeats) * 100)
                    : 0
            };
        }));

        sendSuccess(res, { report });
    } catch (err) {
        next(err);
    }
};
