const mongoose = require('mongoose');
const http = require('https');
const dotenv = require('dotenv');
dotenv.config();

const { Movie } = require('./models');

async function checkImages() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';
    await mongoose.connect(mongoURI);
    console.log('Connected to DB');

    const movies = await Movie.find({});
    console.log(`Checking ${movies.length} movies...`);

    const brokenMovies = [];

    const checkUrl = (url) => {
        return new Promise((resolve) => {
            if (!url) {
                resolve(false);
                return;
            }
            http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).on('error', () => {
                resolve(false);
            });
        });
    };

    for (const movie of movies) {
        const isValid = await checkUrl(movie.posterUrl);
        if (!isValid) {
            brokenMovies.push(movie);
            console.log(`Broken: ${movie.title} - ${movie.posterUrl}`);
        }
    }

    console.log(`Total broken movies: ${brokenMovies.length}`);
    await mongoose.connection.close();
}

checkImages();
