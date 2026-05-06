const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { Booking, Ticket } = require('./models');

async function cleanup() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';
    await mongoose.connect(mongoURI);
    console.log('Connected');

    // Tìm tất cả booking, populate showtime + movie
    const bookings = await Booking.find({}).populate({
        path: 'showtime',
        populate: { path: 'movie' }
    });

    // Lọc booking mà phim đã bị xóa (movie = null)
    const orphanIds = bookings
        .filter(b => !b.showtime || !b.showtime.movie)
        .map(b => b._id);

    console.log('Orphan bookings (phim đã bị xóa):', orphanIds.length);

    if (orphanIds.length > 0) {
        // Xóa tickets liên quan
        const ticketResult = await Ticket.deleteMany({ booking: { $in: orphanIds } });
        console.log('Deleted tickets:', ticketResult.deletedCount);

        // Xóa bookings
        const bookingResult = await Booking.deleteMany({ _id: { $in: orphanIds } });
        console.log('Deleted bookings:', bookingResult.deletedCount);
    }

    console.log('✔ Cleanup done!');
    await mongoose.connection.close();
}

cleanup();
