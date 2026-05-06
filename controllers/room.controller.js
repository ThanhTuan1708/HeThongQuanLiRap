const Room = require('../models/room');
const { sendSuccess, sendError } = require('../utils/response');

// GET /rooms
exports.getRooms = async (req, res, next) => {
    try {
        const { cinemaId } = req.query;
        const query = {};
        if (cinemaId) query.cinema = cinemaId;

        const rooms = await Room.find(query)
            .populate('cinema', 'name code city')
            .populate('seatLayout.seatTypeId', 'name code baseSurcharge')
            .sort({ name: 1 });

        sendSuccess(res, { rooms });
    } catch (err) {
        next(err);
    }
};

// GET /rooms/:roomId
exports.getRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.roomId)
            .populate('cinema', 'name code city')
            .populate('seatLayout.seatTypeId', 'name code baseSurcharge color');

        if (!room) return sendError(res, 'Phòng không tồn tại.', 404);
        sendSuccess(res, { room });
    } catch (err) {
        next(err);
    }
};

// POST /rooms (admin)
exports.createRoom = async (req, res, next) => {
    try {
        const { cinemaId, name, screenType, seatLayout, status } = req.body;
        const room = await Room.create({
            cinema: cinemaId,
            name,
            screenType,
            seatLayout,
            status
        });
        sendSuccess(res, { room }, 'Room created', 201);
    } catch (err) {
        next(err);
    }
};

// PUT /rooms/:roomId (admin)
exports.updateRoom = async (req, res, next) => {
    try {
        const { cinemaId, ...updateData } = req.body;
        if (cinemaId) updateData.cinema = cinemaId;

        const room = await Room.findByIdAndUpdate(
            req.params.roomId,
            updateData,
            { new: true, runValidators: true }
        );
        if (!room) return sendError(res, 'Phòng không tồn tại.', 404);
        sendSuccess(res, { room }, 'Room updated');
    } catch (err) {
        next(err);
    }
};

// DELETE /rooms/:roomId (admin) - soft delete
exports.deleteRoom = async (req, res, next) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.roomId,
            { status: 'inactive' },
            { new: true }
        );
        if (!room) return sendError(res, 'Phòng không tồn tại.', 404);
        sendSuccess(res, { room }, 'Room deactivated');
    } catch (err) {
        next(err);
    }
};
