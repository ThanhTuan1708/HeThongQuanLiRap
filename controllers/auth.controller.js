const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { sendSuccess, sendError } = require('../utils/response');

// Tạo JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// POST /auth/register
exports.register = async (req, res, next) => {
    try {
        const { fullName, email, password, phone } = req.body;

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendError(res, 'Email đã được sử dụng.', 409);
        }

        const user = await User.create({ fullName, email, password, phone });

        sendSuccess(res, {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        }, 'Register successful', 201);
    } catch (err) {
        next(err);
    }
};

// POST /auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Vui lòng nhập email và mật khẩu.', 400);
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return sendError(res, 'Email hoặc mật khẩu không đúng.', 401);
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return sendError(res, 'Email hoặc mật khẩu không đúng.', 401);
        }

        const accessToken = generateToken(user._id);

        sendSuccess(res, {
            accessToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        }, 'Login successful');
    } catch (err) {
        next(err);
    }
};

// GET /auth/me
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        sendSuccess(res, { user });
    } catch (err) {
        next(err);
    }
};

// POST /auth/logout
exports.logout = async (req, res, next) => {
    try {
        // Với JWT stateless, logout phía client xóa token
        // Nếu cần blacklist token, implement thêm ở đây
        sendSuccess(res, null, 'Logout successful');
    } catch (err) {
        next(err);
    }
};
