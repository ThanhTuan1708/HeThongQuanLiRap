import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Search } from 'lucide-react';
import api from '../../api/axios';
import '../Home/Home.css';

const ComingSoon = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const query = new URLSearchParams({ status: 'coming_soon', limit: '60' });
                if (search.trim()) {
                    query.set('search', search.trim());
                }

                const response = await api.get(`/movies?${query.toString()}`);
                setMovies(response?.data?.movies || []);
                setError('');
            } catch (err) {
                setError('Không thể tải danh sách phim sắp chiếu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchMovies, 250);
        return () => clearTimeout(timeoutId);
    }, [search]);

    return (
        <div className="home-page animate-fade-in">
            <section className="container movies-section">
                <div className="section-header">
                    <h2 className="section-title">Phim Sắp Chiếu</h2>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm phim theo tên..."
                        />
                    </div>
                </div>

                {loading ? <div className="loader-container">Đang tải danh sách phim sắp chiếu...</div> : null}
                {error ? <div className="error-message">{error}</div> : null}

                {!loading && !error && movies.length > 0 ? (
                    <div className="movies-grid">
                        {movies.map((movie) => (
                            <Link to={`/movie/${movie._id}`} key={movie._id} className="movie-card">
                                <div className="movie-poster">
                                    <img
                                        src={movie.posterUrl || `https://placehold.co/300x450/1E1E1E/E50914?text=${encodeURIComponent(movie.title)}`}
                                        alt={movie.title}
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://via.placeholder.com/300x450/1E1E1E/E50914?text=${encodeURIComponent(movie.title)}`; }}
                                    />
                                    <div className="movie-overlay">
                                        <button className="btn-book">Xem Chi Tiết</button>
                                    </div>
                                    {movie.ageRating ? <span className="movie-rating">{movie.ageRating}</span> : null}
                                </div>
                                <div className="movie-info">
                                    <h3 className="movie-title">{movie.title}</h3>
                                    <div className="movie-meta">
                                        <span className="meta-item"><Clock size={14} /> {movie.durationMinutes} phút</span>
                                        <span className="meta-item">
                                            <CalendarDays size={14} />
                                            {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Sắp chiếu'}
                                        </span>
                                    </div>
                                    <div className="movie-genre">
                                        {movie.genre?.slice(0, 2).map((genre) => (
                                            <span key={genre} className="genre-tag">{genre}</span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : null}

                {!loading && !error && movies.length === 0 ? (
                    <div className="empty-message">
                        {search ? 'Không tìm thấy phim phù hợp với từ khóa của bạn.' : 'Hiện không có phim sắp chiếu.'}
                    </div>
                ) : null}
            </section>
        </div>
    );
};

export default ComingSoon;
