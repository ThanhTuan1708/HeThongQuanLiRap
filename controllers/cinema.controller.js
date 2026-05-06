const Cinema = require('../models/cinema');
const { sendSuccess, sendError } = require('../utils/response');

// GET /cinemas
exports.getCinemas = async (req, res, next) => {
    try {
        const { city, district, status } = req.query;
        const query = {};
        if (city) query.city = { $regex: city, $options: 'i' };
        if (district) query.district = { $regex: district, $options: 'i' };
        if (status) query.status = status;

        const cinemas = await Cinema.find(query).sort({ name: 1 });
        sendSuccess(res, { cinemas });
    } catch (err) {
        next(err);
    }
};

// GET /cinemas/:cinemaId
exports.getCinema = async (req, res, next) => {
    try {
        const cinema = await Cinema.findById(req.params.cinemaId);
        if (!cinema) return sendError(res, 'Chi nhánh không tồn tại.', 404);
        sendSuccess(res, { cinema });
    } catch (err) {
        next(err);
    }
};

// POST /cinemas (admin)
exports.createCinema = async (req, res, next) => {
    try {
        const cinema = await Cinema.create(req.body);
        sendSuccess(res, { cinema }, 'Cinema created', 201);
    } catch (err) {
        next(err);
    }
};

// PUT /cinemas/:cinemaId (admin)
exports.updateCinema = async (req, res, next) => {
    try {
        const cinema = await Cinema.findByIdAndUpdate(
            req.params.cinemaId,
            req.body,
            { new: true, runValidators: true }
        );
        if (!cinema) return sendError(res, 'Chi nhánh không tồn tại.', 404);
        sendSuccess(res, { cinema }, 'Cinema updated');
    } catch (err) {
        next(err);
    }
};

// DELETE /cinemas/:cinemaId (admin) - soft delete
exports.deleteCinema = async (req, res, next) => {
    try {
        const cinema = await Cinema.findByIdAndUpdate(
            req.params.cinemaId,
            { status: 'inactive' },
            { new: true }
        );
        if (!cinema) return sendError(res, 'Chi nhánh không tồn tại.', 404);
        sendSuccess(res, { cinema }, 'Cinema deactivated');
    } catch (err) {
        next(err);
    }
};
