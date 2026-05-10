const sendSuccess = (res, data = null, message = 'OK', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const sendError = (res, message = 'Error', statusCode = 400, errors = []) => {
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors.length > 0 && { errors })
    });
};

module.exports = { sendSuccess, sendError };
