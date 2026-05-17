const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { Movie, Showtime, Booking, Ticket } = require('./models');

async function removeSpecificMovies() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';
    await mongoose.connect(mongoURI);
    console.log('Connected to DB');

    const titlesToDelete = [
        'Mai',
        'Đào, Phở và Piano',
        'Avengers: Endgame',
        'Kungfu Panda 4'
    ];

    const moviesToDelete = await Movie.find({
        title: { $in: titlesToDelete }
    });

    console.log(`Found ${moviesToDelete.length} movies matching the titles.`);

    if (moviesToDelete.length === 0) {
        console.log('Nothing to delete.');
        await mongoose.connection.close();
        return;
    }

    const movieIds = moviesToDelete.map(m => m._id);

    // Xóa Showtimes
    const showtimes = await Showtime.find({ movie: { $in: movieIds } });
    const showtimeIds = showtimes.map(s => s._id);
    
    if (showtimeIds.length > 0) {
        // Tìm Booking thuộc các Showtime bị xóa
        const bookings = await Booking.find({ showtime: { $in: showtimeIds } });
        const bookingIds = bookings.map(b => b._id);

        if (bookingIds.length > 0) {
            const ticketResult = await Ticket.deleteMany({ booking: { $in: bookingIds } });
            console.log(`Deleted ${ticketResult.deletedCount} tickets.`);

            const bookingResult = await Booking.deleteMany({ _id: { $in: bookingIds } });
            console.log(`Deleted ${bookingResult.deletedCount} bookings.`);
        }

        const showtimeResult = await Showtime.deleteMany({ _id: { $in: showtimeIds } });
        console.log(`Deleted ${showtimeResult.deletedCount} showtimes.`);
    }

    // Xóa Movies
    const movieResult = await Movie.deleteMany({ _id: { $in: movieIds } });
    console.log(`Deleted ${movieResult.deletedCount} movies.`);

    console.log('✔ Cleanup complete!');
    await mongoose.connection.close();
}

removeSpecificMovies();
