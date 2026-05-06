import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import api from '../../api/axios';
import './MovieDetail.css';

const MovieDetail = () => {
    const { movieId } = useParams();
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFormat, setSelectedFormat] = useState('all');
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('all');
    const dates = useMemo(() => (
        Array.from({ length: 7 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + index);
            return date.toISOString().split('T')[0];
        })
    ), []);

    useEffect(() => {
        const fetchMovieData = async () => {
            try {
                const [movieResponse, showtimeResponse] = await Promise.all([
                    api.get(`/movies/${movieId}`),
                    api.get(`/showtimes?movieId=${movieId}`)
                ]);

                setMovie(movieResponse.data?.movie || null);
                setShowtimes(showtimeResponse.data?.showtimes || []);
            } catch (err) {
                setError('Lỗi khi tải thông tin phim. Vui lòng quay lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchMovieData();
    }, [movieId]);

    const filteredShowtimes = showtimes.filter((showtime) => {
        const showtimeDate = new Date(showtime.startTime).toISOString().split('T')[0];
        if (showtimeDate !== selectedDate) return false;

        if (selectedFormat !== 'all') {
            const screenType = showtime.room?.screenType || '2D';
            if (screenType !== selectedFormat) return false;
        }

        if (selectedTimeOfDay !== 'all') {
            const hour = new Date(showtime.startTime).getHours();
            if (selectedTimeOfDay === 'morning' && (hour < 5 || hour >= 12)) return false;
            if (selectedTimeOfDay === 'afternoon' && (hour < 12 || hour >= 18)) return false;
            if (selectedTimeOfDay === 'evening' && (hour < 18 || hour >= 24)) return false;
        }

        return true;
    });

    const showtimesByCinema = filteredShowtimes.reduce((accumulator, showtime) => {
        const cinemaId = showtime.cinema?._id || showtime.cinema;
        if (!cinemaId) return accumulator;

        if (!accumulator[cinemaId]) {
            accumulator[cinemaId] = {
                cinemaId,
                cinemaName: showtime.cinema?.name || 'Rạp đang cập nhật',
                address: showtime.cinema?.address || '',
                times: []
            };
        }

        accumulator[cinemaId].times.push(showtime);
        return accumulator;
    }, {});

    const formatDateTab = (dateString) => {
        const date = new Date(dateString);
        const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const isToday = date.toDateString() === new Date().toDateString();

        return {
            weekday: isToday ? 'Hôm nay' : weekdays[date.getDay()],
            dayMonth: `${date.getDate()}/${date.getMonth() + 1}`
        };
    };

    const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (loading) return <div className="loader-container">Đang tải phim...</div>;
    if (error) return <div className="error-message container">{error}</div>;
    if (!movie) return <div className="error-message container">Không tìm thấy phim.</div>;

    return (
        <div className="movie-detail-page animate-fade-in">
            <div
                className="md-backdrop"
                style={{
                    backgroundImage: `linear-gradient(rgba(18,18,18,0.8), rgba(18,18,18,1)), url(${movie.posterUrl || `https://via.placeholder.com/1200x500/1E1E1E/E50914?text=${encodeURIComponent(movie.title)}`})`
                }}
            >
                <div className="container md-header">
                    <div className="md-poster shadow-glow">
                        <img src={movie.posterUrl || `https://via.placeholder.com/300x450/1E1E1E/E50914?text=${encodeURIComponent(movie.title)}`} alt={movie.title} />
                    </div>
                    <div className="md-info">
                        <h1 className="md-title">{movie.title}</h1>
                        <div className="movie-meta md-meta mb-3">
                            <span className="meta-item"><Clock size={16} /> {movie.durationMinutes} phút</span>
                            {movie.ageRating ? <span className="rating-badge">{movie.ageRating}</span> : null}
                            <span className="meta-item"><Star size={16} color="var(--color-secondary)" fill="var(--color-secondary)" /> 9.5</span>
                        </div>
                        <div className="md-genres gap-2 mb-3">
                            {movie.genre?.map((genre) => (
                                <span key={genre} className="genre-tag">{genre}</span>
                            ))}
                        </div>
                        <p className="md-desc mb-3">{movie.description || 'Chưa có thông tin mô tả cho phim này.'}</p>
                        <div className="md-details text-gray">
                            <p><strong>Ngày khởi chiếu:</strong> {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</p>
                            <p><strong>Ngôn ngữ:</strong> {movie.language || 'English'} - {movie.subtitle || 'Vietsub'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container showtimes-section">
                <div className="section-header">
                    <h2 className="section-title"><Calendar size={24} style={{ display: 'inline', marginRight: '10px' }} />Lịch Chiếu</h2>
                </div>

                <div className="date-tabs">
                    {dates.map((dateString) => {
                        const { weekday, dayMonth } = formatDateTab(dateString);
                        return (
                            <button
                                key={dateString}
                                className={`date-tab ${selectedDate === dateString ? 'active' : ''}`}
                                onClick={() => setSelectedDate(dateString)}
                            >
                                <span className="tab-day">{weekday}</span>
                                <span className="tab-date">{dayMonth}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="smart-filters glass-panel mt-3 mb-4">
                    <div className="filter-group">
                        <span className="filter-label">Định dạng:</span>
                        <div className="filter-chips">
                            <button className={`filter-chip ${selectedFormat === 'all' ? 'active' : ''}`} onClick={() => setSelectedFormat('all')}>Tất cả</button>
                            <button className={`filter-chip ${selectedFormat === '2D' ? 'active' : ''}`} onClick={() => setSelectedFormat('2D')}>2D</button>
                            <button className={`filter-chip ${selectedFormat === '3D' ? 'active' : ''}`} onClick={() => setSelectedFormat('3D')}>3D</button>
                            <button className={`filter-chip ${selectedFormat === 'IMAX' ? 'active' : ''}`} onClick={() => setSelectedFormat('IMAX')}>IMAX</button>
                            <button className={`filter-chip ${selectedFormat === '4DX' ? 'active' : ''}`} onClick={() => setSelectedFormat('4DX')}>4DX</button>
                        </div>
                    </div>
                    
                    <div className="filter-group">
                        <span className="filter-label">Thời gian:</span>
                        <div className="filter-chips">
                            <button className={`filter-chip ${selectedTimeOfDay === 'all' ? 'active' : ''}`} onClick={() => setSelectedTimeOfDay('all')}>Tất cả</button>
                            <button className={`filter-chip ${selectedTimeOfDay === 'morning' ? 'active' : ''}`} onClick={() => setSelectedTimeOfDay('morning')}>Sáng (5h-12h)</button>
                            <button className={`filter-chip ${selectedTimeOfDay === 'afternoon' ? 'active' : ''}`} onClick={() => setSelectedTimeOfDay('afternoon')}>Chiều (12h-18h)</button>
                            <button className={`filter-chip ${selectedTimeOfDay === 'evening' ? 'active' : ''}`} onClick={() => setSelectedTimeOfDay('evening')}>Tối (18h-24h)</button>
                        </div>
                    </div>
                </div>

                <div className="cinemas-list mt-4">
                    {Object.values(showtimesByCinema).length > 0 ? (
                        Object.values(showtimesByCinema).map((cinema) => (
                            <div key={cinema.cinemaId} className="cinema-group glass-panel mb-4">
                                <div className="cinema-header mb-3">
                                    <h3 className="cinema-name text-primary">{cinema.cinemaName}</h3>
                                    <p className="cinema-address text-gray"><MapPin size={14} style={{ display: 'inline' }} /> {cinema.address || 'Địa chỉ đang cập nhật'}</p>
                                </div>
                                <div className="time-slots">
                                    {cinema.times
                                        .sort((left, right) => new Date(left.startTime) - new Date(right.startTime))
                                        .map((showtime) => (
                                            <Link to={`/booking/${showtime._id}`} key={showtime._id} className="time-slot">
                                                <span className="slot-time">{formatTime(showtime.startTime)}</span>
                                                <span className="slot-format">{showtime.room?.screenType || '2D'}</span>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-message glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
                            Hiện không có lịch chiếu nào cho ngày này. Vui lòng chọn ngày khác.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetail;
