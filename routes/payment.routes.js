const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
    createPayment,
    getPayment,
    getPaymentByBooking,
    webhook,
    paymentReturn,
    simulateSuccess,
    mockGateway
} = require('../controllers/payment.controller');

router.post('/create', protect, createPayment);
router.get('/booking/:bookingId', protect, getPaymentByBooking);
router.get('/mock-gateway/:paymentId', mockGateway);
router.post('/simulate-success/:paymentId', protect, simulateSuccess);

router.post('/webhook/:provider', webhook);
router.get('/return/:provider', paymentReturn);
router.get('/:paymentId', protect, getPayment);

module.exports = router;
