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
                setError('Khong the tai danh sach phim sap chieu. Vui long thu lai sau.');
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
                    <h2 className="section-title">Phim Sap Chieu</h2>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tim phim theo ten..."
                        />
                    </div>
                </div>

                {loading ? <div className="loader-container">Dang tai danh sach phim sap chieu...</div> : null}
                {error ? <div className="error-message">{error}</div> : null}

                {!loading && !error && movies.length > 0 ? (
                    <div className="movies-grid">
                        {movies.map((movie) => (
                            <Link to={`/movie/${movie._id}`} key={movie._id} className="movie-card">
                                <div className="movie-poster">
                                    <img
                                        src={movie.posterUrl || `https://placehold.co/300x450/1E1E1E/E50914?text=${encodeURIComponent(movie.title)}`}
                                        alt={movie.title}
                                    />
                                    <div className="movie-overlay">
                                        <button className="btn-book">Xem Chi Tiet</button>
                                    </div>
                                    {movie.ageRating ? <span className="movie-rating">{movie.ageRating}</span> : null}
                                </div>
                                <div className="movie-info">
                                    <h3 className="movie-title">{movie.title}</h3>
                                    <div className="movie-meta">
                                        <span className="meta-item"><Clock size={14} /> {movie.durationMinutes} phut</span>
                                        <span className="meta-item">
                                            <CalendarDays size={14} />
                                            {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Sap chieu'}
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
                        {search ? 'Khong tim thay phim phu hop voi tu khoa cua ban.' : 'Hien khong co phim sap chieu.'}
                    </div>
                ) : null}
            </section>
        </div>
    );
};

export default ComingSoon;
