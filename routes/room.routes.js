const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getRooms, getRoom, createRoom, updateRoom, deleteRoom
} = require('../controllers/room.controller');

router.get('/', getRooms);
router.get('/:roomId', getRoom);
router.post('/', protect, authorize('admin'), createRoom);
router.put('/:roomId', protect, authorize('admin'), updateRoom);
router.delete('/:roomId', protect, authorize('admin'), deleteRoom);

module.exports = router;
