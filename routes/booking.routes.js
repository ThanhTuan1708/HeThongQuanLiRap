const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
    createBooking, getBooking, getMyBookings, applyPromotion, cancelBooking
} = require('../controllers/booking.controller');

router.use(protect); // Tất cả routes cần đăng nhập

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.patch('/:bookingId/promotion', applyPromotion);
router.get('/:bookingId', getBooking);
router.patch('/:bookingId/cancel', cancelBooking);

module.exports = router;
