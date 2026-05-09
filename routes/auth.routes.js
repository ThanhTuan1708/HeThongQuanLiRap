const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { register, login, getMe, logout } = require('../controllers/auth.controller');

router.post('/register', [
    body('fullName').notEmpty().withMessage('Tên là bắt buộc'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
    validate
], register);

router.post('/login', [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
    validate
], login);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
