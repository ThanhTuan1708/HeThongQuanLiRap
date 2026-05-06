const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getMovies, getMovie, createMovie, updateMovie, deleteMovie
} = require('../controllers/movie.controller');

router.get('/', getMovies);
router.get('/:movieId', getMovie);
router.post('/', protect, authorize('admin'), createMovie);
router.put('/:movieId', protect, authorize('admin'), updateMovie);
router.delete('/:movieId', protect, authorize('admin'), deleteMovie);

module.exports = router;
