const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { Movie, Cinema, Room, SeatType, Showtime } = require('./models');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';
const tmdbApiKey = process.env.TMDB_API_KEY || '85ce3e966ce8917dc12524ebb5715a06';
const tmdbLanguage = process.env.TMDB_LANGUAGE || 'vi-VN';
const tmdbImageBaseUrl = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';
const tmdbUpcomingRegion = process.env.TMDB_UPCOMING_REGION || '';
const tmdbPopularUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=${tmdbLanguage}`;
const tmdbUpcomingUrl = `https://api.themoviedb.org/3/movie/upcoming?api_key=${tmdbApiKey}&language=${tmdbLanguage}${tmdbUpcomingRegion ? `&region=${tmdbUpcomingRegion}` : ''}`;

const popularPageCount = Number(process.env.TMDB_POPULAR_PAGES || 3);
const upcomingPageCount = Number(process.env.TMDB_UPCOMING_PAGES || 3);
const showtimeHours = [9, 10, 12, 14, 15, 17, 19, 20, 21, 22];

const pricingByScreenType = (seatTypes) => ({
    'IMAX': [
        { seatTypeId: seatTypes.NORMAL._id, price: 100000 },
        { seatTypeId: seatTypes.VIP._id, price: 140000 },
        { seatTypeId: seatTypes.SWEETBOX._id, price: 180000 }
    ],
    '3D': [
        { seatTypeId: seatTypes.NORMAL._id, price: 90000 },
        { seatTypeId: seatTypes.VIP._id, price: 125000 },
        { seatTypeId: seatTypes.SWEETBOX._id, price: 165000 }
    ],
    '4DX': [
        { seatTypeId: seatTypes.NORMAL._id, price: 110000 },
        { seatTypeId: seatTypes.VIP._id, price: 150000 },
        { seatTypeId: seatTypes.SWEETBOX._id, price: 200000 }
    ],
    '2D': [
        { seatTypeId: seatTypes.NORMAL._id, price: 75000 },
        { seatTypeId: seatTypes.VIP._id, price: 105000 },
        { seatTypeId: seatTypes.SWEETBOX._id, price: 145000 }
    ]
});

const normalizeSlug = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toAgeRating = (adult) => (adult ? 'C18' : 'P');

const toPosterUrl = (posterPath) => {
    if (!posterPath) return '';
    return `${tmdbImageBaseUrl}${posterPath}`;
};

const toMoviePayload = (movie, detail, status) => {
    const title = detail.title || movie.title || movie.original_title;
    const genres = Array.isArray(detail.genres) ? detail.genres.map((genre) => genre.name).filter(Boolean) : [];
    const runtime = Number(detail.runtime || movie.runtime || 0);

    return {
        title,
        slug: `tmdb-${movie.id}-${normalizeSlug(title) || 'movie'}`,
        description: detail.overview || movie.overview || 'Thong tin phim dang duoc cap nhat tu TMDB.',
        genre: genres.length > 0 ? genres : ['Dien anh'],
        durationMinutes: runtime > 0 ? runtime : 100,
        language: detail.original_language || movie.original_language || 'vi',
        subtitle: 'Vietnamese',
        posterUrl: toPosterUrl(detail.poster_path || movie.poster_path),
        trailerUrl: detail.homepage || '',
        releaseDate: detail.release_date ? new Date(detail.release_date) : undefined,
        ageRating: toAgeRating(Boolean(detail.adult || movie.adult)),
        status
    };
};

const seatLayoutFactory = (seatTypes) => {
    const seats = [];
    const rows = 'ABCDEFGH'.split('');

    rows.forEach((row, rowIndex) => {
        for (let col = 1; col <= 12; col += 1) {
            let seatTypeId = seatTypes.NORMAL._id;
            let zone = 'standard';

            if (rowIndex >= 3 && rowIndex <= 5) {
                seatTypeId = seatTypes.VIP._id;
                zone = 'vip';
            }

            if (rowIndex === rows.length - 1) {
                seatTypeId = seatTypes.SWEETBOX._id;
                zone = 'sweetbox';
            }

            seats.push({
                seatCode: `${row}${col}`,
                row,
                col,
                seatTypeId,
                zone,
                isActive: true
            });
        }
    });

    return seats;
};

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`TMDB request failed ${response.status}: ${url}`);
    }
    return response.json();
}

async function fetchTmdbMovies(url, pageCount) {
    const moviesById = new Map();

    for (let page = 1; page <= pageCount; page += 1) {
        const separator = url.includes('?') ? '&' : '?';
        const data = await fetchJson(`${url}${separator}page=${page}`);
        const results = Array.isArray(data.results) ? data.results : [];

        for (const movie of results) {
            moviesById.set(movie.id, movie);
        }

        if (!data.total_pages || page >= data.total_pages) {
            break;
        }
    }

    return [...moviesById.values()];
}

async function fetchMovieDetail(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=${tmdbLanguage}`;
    return fetchJson(url);
}

async function ensureSeatTypes() {
    const definitions = [
        { code: 'NORMAL', name: 'Ghe Thuong', baseSurcharge: 0, color: '#4CAF50' },
        { code: 'VIP', name: 'Ghe VIP', baseSurcharge: 30000, color: '#FF9800' },
        { code: 'SWEETBOX', name: 'Ghe Sweetbox', baseSurcharge: 60000, color: '#E91E63' }
    ];

    const result = {};
    for (const definition of definitions) {
        result[definition.code] = await SeatType.findOneAndUpdate(
            { code: definition.code },
            definition,
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
        );
    }

    return result;
}

async function ensureCinema() {
    return Cinema.findOneAndUpdate(
        { code: 'LOTTE_HCM_Q1' },
        {
            code: 'LOTTE_HCM_Q1',
            name: 'Lotte Cinema TP.HCM',
            city: 'TP.HCM',
            district: 'Quan 1',
            address: 'Khu vuc trung tam TP.HCM',
            phone: '1900-6017',
            email: 'support@lottecinemavn.com',
            timezone: 'Asia/Ho_Chi_Minh',
            description: 'Du lieu phim dong bo tu TMDB, lich chieu duoc tao tu dong cho he thong dat ve.',
            location: { type: 'Point', coordinates: [106.7009, 10.7769] },
            status: 'active'
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
}

async function ensureRoom(cinemaId, seatTypes) {
    return Room.findOneAndUpdate(
        { cinema: cinemaId, name: 'Phong 1 - 2D' },
        {
            cinema: cinemaId,
            name: 'Phong 1 - 2D',
            screenType: '2D',
            seatLayout: seatLayoutFactory(seatTypes),
            status: 'active'
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
}

function createShowtimeWindow(dayOffset, hour, durationMinutes) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + dayOffset);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    return { startTime, endTime };
}

async function upsertMovie(payload) {
    return Movie.findOneAndUpdate(
        { slug: payload.slug },
        payload,
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
}

async function clearAllFutureShowtimes() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Showtime.deleteMany({
        startTime: { $gte: today },
        status: { $in: ['open', 'now_playing'] }
    });
    console.log(`Cleared ${result.deletedCount} future showtimes.`);
}

async function createShowtimesForAllCinemas(movies, seatTypes) {
    if (movies.length === 0) {
        console.log('No movies to create showtimes for.');
        return 0;
    }

    const cinemas = await Cinema.find({ status: 'active' });
    if (cinemas.length === 0) {
        console.log('No active cinemas found.');
        return 0;
    }

    const allRooms = await Room.find({ status: 'active' });
    const priceMap = pricingByScreenType(seatTypes);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOf2026 = new Date(2026, 11, 31);

    const showtimeBatch = [];

    for (const cinema of cinemas) {
        const rooms = allRooms.filter(r => r.cinema.toString() === cinema._id.toString());
        if (rooms.length === 0) continue;

        // Tạo lịch chiếu từ hôm nay đến hết 2026, cách 2 ngày
        const currentDate = new Date(today);
        while (currentDate <= endOf2026) {
            const dayOfWeek = currentDate.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const dayNum = Math.floor((currentDate - today) / (24 * 60 * 60 * 1000));

            for (let ri = 0; ri < rooms.length; ri++) {
                const room = rooms[ri];
                const pricing = priceMap[room.screenType] || priceMap['2D'];
                const finalPricing = isWeekend
                    ? pricing.map(p => ({ seatTypeId: p.seatTypeId, price: Math.round(p.price * 1.15 / 1000) * 1000 }))
                    : pricing;

                // Mỗi phòng chiếu 3-4 suất/ngày
                const slotOffset = (dayNum + ri) % showtimeHours.length;
                const slotsForRoom = [
                    showtimeHours[slotOffset],
                    showtimeHours[(slotOffset + 3) % showtimeHours.length],
                    showtimeHours[(slotOffset + 6) % showtimeHours.length]
                ];
                // Cuối tuần thêm 1 suất
                if (isWeekend) {
                    slotsForRoom.push(showtimeHours[(slotOffset + 8) % showtimeHours.length]);
                }

                for (let si = 0; si < slotsForRoom.length; si++) {
                    const hour = slotsForRoom[si];
                    const movieIdx = (dayNum * rooms.length * 4 + ri * 4 + si) % movies.length;
                    const movie = movies[movieIdx];

                    const startTime = new Date(currentDate);
                    startTime.setHours(hour, (si % 2 === 0) ? 0 : 30, 0, 0);
                    const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60000);

                    showtimeBatch.push({
                        movie: movie._id,
                        cinema: cinema._id,
                        room: room._id,
                        startTime,
                        endTime,
                        pricing: finalPricing,
                        status: 'open'
                    });
                }
            }

            // Tiến thêm 2 ngày
            currentDate.setDate(currentDate.getDate() + 2);
        }
    }

    // Chèn theo batch để tối ưu hiệu suất
    const batchSize = 500;
    for (let i = 0; i < showtimeBatch.length; i += batchSize) {
        await Showtime.insertMany(showtimeBatch.slice(i, i + batchSize));
    }

    return showtimeBatch.length;
}

async function syncMovieList(tmdbMovies, status) {
    const syncedMovies = [];

    for (const tmdbMovie of tmdbMovies) {
        if (!tmdbMovie.poster_path) {
            console.log(`Skipped ${status} movie without poster: ${tmdbMovie.title || tmdbMovie.original_title || tmdbMovie.id}`);
            continue;
        }

        const detail = await fetchMovieDetail(tmdbMovie.id);
        const payload = toMoviePayload(tmdbMovie, detail, status);
        const movie = await upsertMovie(payload);
        syncedMovies.push(movie);
        console.log(`Synced ${status} movie: ${movie.title}`);
    }

    return syncedMovies;
}

async function syncMovies() {
    try {
        await mongoose.connect(mongoURI);
        console.log(`Connected to MongoDB: ${mongoURI}`);

        const [popularMovies, upcomingMovies] = await Promise.all([
            fetchTmdbMovies(tmdbPopularUrl, popularPageCount),
            fetchTmdbMovies(tmdbUpcomingUrl, upcomingPageCount)
        ]);

        if (popularMovies.length === 0 && upcomingMovies.length === 0) {
            throw new Error('TMDB did not return any movies.');
        }

        const seatTypes = await ensureSeatTypes();
        const cinema = await ensureCinema();
        await ensureRoom(cinema._id, seatTypes);

        const syncedPopularMovies = await syncMovieList(popularMovies, 'now_showing');
        const syncedUpcomingMovies = await syncMovieList(upcomingMovies, 'coming_soon');

        // Xóa lịch chiếu cũ và tạo lại
        await clearAllFutureShowtimes();

        // Tạo lịch chiếu cho phim đang chiếu trên TẤT CẢ rạp/phòng, xuyên suốt đến hết 2026
        const allNowShowing = await Movie.find({ status: 'now_showing' });
        const totalShowtimes = await createShowtimesForAllCinemas(allNowShowing, seatTypes);

        console.log(`\n🎬 === SYNC HOÀN TẤT ===`);
        console.log(`📽  Popular movies synced: ${syncedPopularMovies.length}`);
        console.log(`🎞  Upcoming movies synced: ${syncedUpcomingMovies.length}`);
        console.log(`🎫 Total showtimes created: ${totalShowtimes} (until end of 2026)`);
    } catch (error) {
        console.error('Movie sync failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

syncMovies();

