const SeatType = require('../models/seatType');
const { sendSuccess, sendError } = require('../utils/response');

// GET /seat-types
exports.getSeatTypes = async (req, res, next) => {
    try {
        const { all } = req.query;
        const query = all === 'true' ? {} : { isActive: true };
        const seatTypes = await SeatType.find(query).sort({ baseSurcharge: 1 });
        sendSuccess(res, { seatTypes });
    } catch (err) {
        next(err);
    }
};

// POST /seat-types (admin)
exports.createSeatType = async (req, res, next) => {
    try {
        const seatType = await SeatType.create(req.body);
        sendSuccess(res, { seatType }, 'SeatType created', 201);
    } catch (err) {
        next(err);
    }
};

// PUT /seat-types/:seatTypeId (admin)
exports.updateSeatType = async (req, res, next) => {
    try {
        const seatType = await SeatType.findByIdAndUpdate(
            req.params.seatTypeId,
            req.body,
            { new: true, runValidators: true }
        );
        if (!seatType) return sendError(res, 'Loại ghế không tồn tại.', 404);
        sendSuccess(res, { seatType }, 'SeatType updated');
    } catch (err) {
        next(err);
    }
};

// DELETE /seat-types/:seatTypeId (admin) - soft delete
exports.deleteSeatType = async (req, res, next) => {
    try {
        const seatType = await SeatType.findByIdAndUpdate(
            req.params.seatTypeId,
            { isActive: false },
            { new: true }
        );
        if (!seatType) return sendError(res, 'Loại ghế không tồn tại.', 404);
        sendSuccess(res, { seatType }, 'SeatType deactivated');
    } catch (err) {
        next(err);
    }
};
