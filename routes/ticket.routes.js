const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getTicket, getTicketsByBooking, checkIn } = require('../controllers/ticket.controller');

router.get('/booking/:bookingId', protect, getTicketsByBooking);
router.get('/:ticketId', protect, getTicket);
router.post('/:ticketId/check-in', protect, authorize('admin'), checkIn);

module.exports = router;
