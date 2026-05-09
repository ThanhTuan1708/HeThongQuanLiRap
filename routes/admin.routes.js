const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getDashboard, getAllBookings, getAllPayments,
    getRevenue, getShowtimeReport
} = require('../controllers/admin.controller');

router.use(protect, authorize('admin')); // Tất cả routes admin-only

router.get('/dashboard', getDashboard);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get('/revenue', getRevenue);
router.get('/showtimes/report', getShowtimeReport);

module.exports = router;
