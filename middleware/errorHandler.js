const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = [];

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Giá trị '${err.keyValue[field]}' đã tồn tại.`;
        errors = [{ field, message }];
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Không tìm thấy resource với id: ${err.value}`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token không hợp lệ.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token đã hết hạn.';
    }

    console.error('Error:', err);

    res.status(statusCode).json({
        success: false,
        message,
        ...(errors.length > 0 && { errors })
    });
};

module.exports = errorHandler;
