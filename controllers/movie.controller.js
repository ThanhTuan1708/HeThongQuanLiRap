const Movie = require('../models/movie');
const { sendSuccess, sendError } = require('../utils/response');

// GET /movies
exports.getMovies = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status, genre } = req.query;
        const query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (status) query.status = status;
        if (genre) query.genre = { $in: [genre] };

        const movies = await Movie.find(query)
            .sort({ releaseDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        sendSuccess(res, {
            movies,
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

// GET /movies/:movieId
exports.getMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.movieId);
        if (!movie) return sendError(res, 'Phim không tồn tại.', 404);
        sendSuccess(res, { movie });
    } catch (err) {
        next(err);
    }
};

// POST /movies (admin)
exports.createMovie = async (req, res, next) => {
    try {
        const movie = await Movie.create(req.body);
        sendSuccess(res, { movie }, 'Movie created', 201);
    } catch (err) {
        next(err);
    }
};

// PUT /movies/:movieId (admin)
exports.updateMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.movieId,
            req.body,
            { new: true, runValidators: true }
        );
        if (!movie) return sendError(res, 'Phim không tồn tại.', 404);
        sendSuccess(res, { movie }, 'Movie updated');
    } catch (err) {
        next(err);
    }
};

// DELETE /movies/:movieId (admin) - soft delete
exports.deleteMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.movieId,
            { status: 'ended' },
            { new: true }
        );
        if (!movie) return sendError(res, 'Phim không tồn tại.', 404);
        sendSuccess(res, { movie }, 'Movie deleted (soft)');
    } catch (err) {
        next(err);
    }
};
