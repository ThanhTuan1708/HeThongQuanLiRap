const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, getUserBookings } = require('../controllers/user.controller');

router.use(protect); // Tất cả routes cần đăng nhập

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/bookings', getUserBookings);

module.exports = router;
