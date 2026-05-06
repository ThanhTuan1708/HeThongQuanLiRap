const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getSeatTypes, createSeatType, updateSeatType, deleteSeatType
} = require('../controllers/seatType.controller');

router.get('/', getSeatTypes);
router.post('/', protect, authorize('admin'), createSeatType);
router.put('/:seatTypeId', protect, authorize('admin'), updateSeatType);
router.delete('/:seatTypeId', protect, authorize('admin'), deleteSeatType);

module.exports = router;
