import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Film, Clock } from 'lucide-react';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';
import './Ticketing.css';

const Ticketing = () => {
    usePageTitle('Mua Vé Nhanh');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMovieId = searchParams.get('movieId');
    
    // States
    const [cinemas, setCinemas] = useState([]);
    const [allShowtimes, setAllShowtimes] = useState([]);
    const [loading, setLoading] = useState({ cinemas: true, showtimes: false });
    
    // Selection States
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedCinema, setSelectedCinema] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);

    // Set initial movie if passed in URL
    useEffect(() => {
        if (initialMovieId && !selectedMovie) {
            setSelectedMovie({ _id: initialMovieId });
            // Fetch the movie to get its title in case it has no showtimes today
            api.get(`/movies/${initialMovieId}`)
                .then(res => {
                    if (res.data?.movie) {
                        setSelectedMovie(res.data.movie);
                    }
                })
                .catch(console.error);
        }
    }, [initialMovieId]);

    // Generate next 14 days
    const dates = useMemo(() => {
        return Array.from({ length: 14 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + index);
            return date.toISOString().split('T')[0];
        });
    }, []);

    const formatDateTab = (dateString) => {
        const date = new Date(dateString);
        const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const isToday = date.toDateString() === new Date().toDateString();
        return {
            weekday: isToday ? 'Hôm nay' : weekdays[date.getDay()],
            dayMonth: `${date.getDate()}/${date.getMonth() + 1}`,
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    };

    // 1. Fetch All Cinemas once
    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                const res = await api.get('/cinemas?status=active');
                setCinemas(res.data?.cinemas || []);
            } catch (err) {
                console.error('Lỗi khi tải cụm rạp', err);
            } finally {
                setLoading(prev => ({ ...prev, cinemas: false }));
            }
        };
        fetchCinemas();
    }, []);

    // 2. Fetch All Showtimes for the Selected Date
    useEffect(() => {
        const fetchShowtimes = async () => {
            setLoading(prev => ({ ...prev, showtimes: true }));
            try {
                const res = await api.get(`/showtimes?date=${selectedDate}`);
                setAllShowtimes(res.data?.showtimes || []);
            } catch (err) {
                console.error('Lỗi khi tải suất chiếu', err);
            } finally {
                setLoading(prev => ({ ...prev, showtimes: false }));
            }
        };
        fetchShowtimes();
    }, [selectedDate]);

    // Derived Data
    const cities = useMemo(() => ['all', ...new Set(cinemas.map(c => c.city))], [cinemas]);
    
    const dayMovies = useMemo(() => {
        const mMap = new Map();
        allShowtimes.forEach(st => {
            if (st.movie && !mMap.has(st.movie._id)) {
                mMap.set(st.movie._id, st.movie);
            }
        });
        return Array.from(mMap.values());
    }, [allShowtimes]);

    // Update selectedMovie with full details if it only has _id (from URL) and we found it in dayMovies
    useEffect(() => {
        if (selectedMovie && !selectedMovie.title && dayMovies.length > 0) {
            const fullMovie = dayMovies.find(m => m._id === selectedMovie._id);
            if (fullMovie) setSelectedMovie(fullMovie);
        }
    }, [dayMovies, selectedMovie]);

    // Bi-directional Filters
    const filteredCinemas = useMemo(() => {
        let list = cinemas;
        if (selectedMovie) {
            const validCinemaIds = new Set(allShowtimes.filter(st => st.movie?._id === selectedMovie._id).map(st => st.cinema?._id));
            // Only filter cinemas if the movie actually has showtimes today, otherwise show none
            list = list.filter(c => validCinemaIds.has(c._id));
        }
        if (selectedCity !== 'all') {
            list = list.filter(c => c.city === selectedCity);
        }
        return list;
    }, [cinemas, allShowtimes, selectedMovie, selectedCity]);

    const filteredMovies = useMemo(() => {
        let list = [...dayMovies];
        // Ensure selected movie is always in the list even if no showtimes today
        if (selectedMovie && selectedMovie.title && !list.find(m => m._id === selectedMovie._id)) {
            list.unshift(selectedMovie);
        }

        if (selectedCinema) {
            const validMovieIds = new Set(allShowtimes.filter(st => st.cinema?._id === selectedCinema._id).map(st => st.movie?._id));
            // Also keep the selected movie visible even if it's not playing at this cinema
            list = list.filter(m => validMovieIds.has(m._id) || (selectedMovie && m._id === selectedMovie._id));
        }
        return list;
    }, [dayMovies, allShowtimes, selectedCinema, selectedMovie]);

    const finalShowtimes = useMemo(() => {
        if (!selectedCinema || !selectedMovie) return [];
        return allShowtimes
            .filter(st => st.cinema?._id === selectedCinema._id && st.movie?._id === selectedMovie._id)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [allShowtimes, selectedCinema, selectedMovie]);

    const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('vi-VN', {
        hour: '2-digit', minute: '2-digit'
    });

    const toggleCinema = (cinema) => {
        setSelectedCinema(prev => prev?._id === cinema._id ? null : cinema);
    };

    const toggleMovie = (movie) => {
        setSelectedMovie(prev => prev?._id === movie._id ? null : movie);
    };

    return (
        <div className="ticketing-page container animate-fade-in">
            <h1 className="page-title mb-4">Mua Vé Phim</h1>
            
            <div className="date-selector glass-panel mb-4">
                <div className="date-scroll">
                    {dates.map((dateString) => {
                        const { weekday, dayMonth, year } = formatDateTab(dateString);
                        return (
                            <button
                                key={dateString}
                                className={`date-tab-ticket ${selectedDate === dateString ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedDate(dateString);
                                    // Optionally reset selections when date changes if desired
                                    // setSelectedCinema(null); setSelectedMovie(null);
                                }}
                            >
                                <span className="month-year">{year}</span>
                                <span className="tab-day">{weekday}</span>
                                <span className="tab-date">{dayMonth}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="ticketing-grid">
                
                {/* Column 1: Cinemas */}
                <div className="ticket-col col-cinemas glass-panel">
                    <div className="col-header">
                        <MapPin size={20} />
                        <h2>Chọn Rạp</h2>
                    </div>
                    
                    <div className="city-filter">
                        {cities.map(city => (
                            <button 
                                key={city} 
                                className={`city-btn ${selectedCity === city ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedCity(city);
                                    setSelectedCinema(null); // Reset cinema when changing city
                                }}
                            >
                                {city === 'all' ? 'Tất cả' : city}
                            </button>
                        ))}
                    </div>

                    <div className="list-container">
                        {loading.cinemas ? <div className="p-3 text-center">Đang tải...</div> : null}
                        {filteredCinemas.length === 0 && !loading.cinemas ? (
                             <div className="empty-state text-gray">Không có rạp nào phù hợp.</div>
                        ) : (
                            filteredCinemas.map(cinema => (
                                <div 
                                    key={cinema._id} 
                                    className={`list-item ${selectedCinema?._id === cinema._id ? 'selected' : ''}`}
                                    onClick={() => toggleCinema(cinema)}
                                >
                                    <div className="item-title">{cinema.name}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Movies */}
                <div className="ticket-col col-movies glass-panel">
                    <div className="col-header">
                        <Film size={20} />
                        <h2>Chọn Phim</h2>
                    </div>
                    
                    <div className="list-container">
                        {loading.showtimes ? (
                            <div className="p-3 text-center">Đang tải phim...</div>
                        ) : filteredMovies.length === 0 ? (
                            <div className="empty-state text-gray">Không có phim nào chiếu tại rạp này trong ngày.</div>
                        ) : (
                            filteredMovies.map(movie => (
                                <div 
                                    key={movie._id} 
                                    className={`list-item movie-item ${selectedMovie?._id === movie._id ? 'selected' : ''}`}
                                    onClick={() => toggleMovie(movie)}
                                >
                                    <div className="movie-item-content">
                                        <div className="movie-badge">
                                            {movie.ageRating ? <span className="age-rating-small">{movie.ageRating}</span> : null}
                                        </div>
                                        <div className="item-title">{movie.title || 'Đang tải tên phim...'}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 3: Showtimes */}
                <div className="ticket-col col-showtimes glass-panel">
                    <div className="col-header">
                        <Clock size={20} />
                        <h2>Chọn Suất Chiếu</h2>
                    </div>

                    <div className="list-container">
                        {(!selectedCinema || !selectedMovie) ? (
                            <div className="empty-state text-gray">Vui lòng chọn Rạp và Phim để xem suất chiếu.</div>
                        ) : finalShowtimes.length === 0 ? (
                            <div className="empty-state text-gray">Không tìm thấy suất chiếu.</div>
                        ) : (
                            <div className="showtimes-grid">
                                {finalShowtimes.map(st => (
                                    <button 
                                        key={st._id} 
                                        className="st-btn"
                                        onClick={() => navigate(`/booking/${st._id}`)}
                                    >
                                        <span className="st-time">{formatTime(st.startTime)}</span>
                                        <div className="st-info">
                                            <span>{st.room?.screenType || '2D'}</span>
                                            <span>{st.room?.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Ticketing;
