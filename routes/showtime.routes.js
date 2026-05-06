const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getShowtimes, getShowtime, getSeats,
    createShowtime, updateShowtime, deleteShowtime
} = require('../controllers/showtime.controller');
const { lockSeats, unlockSeats } = require('../controllers/seatLock.controller');

// Suất chiếu
router.get('/', getShowtimes);
router.get('/:showtimeId', getShowtime);
router.post('/', protect, authorize('admin'), createShowtime);
router.put('/:showtimeId', protect, authorize('admin'), updateShowtime);
router.delete('/:showtimeId', protect, authorize('admin'), deleteShowtime);

// Sơ đồ ghế + Lock/Unlock
router.get('/:showtimeId/seats', getSeats);
router.post('/:showtimeId/seat-locks', protect, lockSeats);
router.delete('/:showtimeId/seat-locks', protect, unlockSeats);

module.exports = router;
