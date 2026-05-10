// File tổng hợp tất cả Models
const User = require('./user');
const Movie = require('./movie');
const Cinema = require('./cinema');
const Room = require('./room');
const SeatType = require('./seatType');
const Showtime = require('./showtime');
const SeatLock = require('./seatLock');
const Booking = require('./booking');
const Ticket = require('./ticket');
const Promotion = require('./promotion');
const PromotionUsage = require('./promotionUsage');
const Payment = require('./payment');
const PaymentEvent = require('./paymentEvent');
const Refund = require('./refund');

module.exports = {
    User,
    Movie,
    Cinema,
    Room,
    SeatType,
    Showtime,
    SeatLock,
    Booking,
    Ticket,
    Promotion,
    PromotionUsage,
    Payment,
    PaymentEvent,
    Refund
};
