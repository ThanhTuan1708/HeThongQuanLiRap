const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getCinemas, getCinema, createCinema, updateCinema, deleteCinema
} = require('../controllers/cinema.controller');

router.get('/', getCinemas);
router.get('/:cinemaId', getCinema);
router.post('/', protect, authorize('admin'), createCinema);
router.put('/:cinemaId', protect, authorize('admin'), updateCinema);
router.delete('/:cinemaId', protect, authorize('admin'), deleteCinema);

module.exports = router;
