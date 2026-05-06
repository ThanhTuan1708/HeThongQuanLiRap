import React, { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Phone } from 'lucide-react';
import api from '../../api/axios';
import './Cinemas.css';

const Cinemas = () => {
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');

    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                const response = await api.get('/cinemas?status=active');
                setCinemas(response?.data?.cinemas || []);
            } catch (err) {
                setError(err.message || 'Không thể tải danh sách cụm rạp.');
            } finally {
                setLoading(false);
            }
        };

        fetchCinemas();
    }, []);

    const cities = useMemo(() => ['all', ...new Set(cinemas.map((cinema) => cinema.city))], [cinemas]);
    const filteredCinemas = cinemas.filter((cinema) => selectedCity === 'all' || cinema.city === selectedCity);

    return (
        <div className="cinemas-page container animate-fade-in">
            <div className="cinemas-hero glass-panel">
                <span className="eyebrow">Cụm Rạp</span>
                <h1>Chọn rạp gần bạn nhất</h1>
                <p>Thông tin địa chỉ, số điện thoại và mô tả nhanh cho từng cụm rạp đang hoạt động trong hệ thống.</p>
            </div>

            <div className="cinema-filter-row">
                {cities.map((city) => (
                    <button
                        key={city}
                        className={`city-chip ${selectedCity === city ? 'active' : ''}`}
                        onClick={() => setSelectedCity(city)}
                    >
                        {city === 'all' ? 'Tất cả' : city}
                    </button>
                ))}
            </div>

            {loading ? <div className="loader-container">Đang tải cụm rạp...</div> : null}
            {error ? <div className="error-message">{error}</div> : null}

            {!loading && !error ? (
                <div className="cinema-grid">
                    {filteredCinemas.map((cinema) => (
                        <article className="cinema-card glass-panel" key={cinema._id}>
                            <div className="cinema-card-top">
                                <div>
                                    <span className="city-badge">{cinema.city}</span>
                                    <h3>{cinema.name}</h3>
                                </div>
                                <Building2 size={28} className="text-primary" />
                            </div>

                            <p className="cinema-desc">{cinema.description || 'Cụm rạp hiện đại với phòng chiếu và khu chờ thoải mái.'}</p>

                            <div className="cinema-meta">
                                <div className="meta-line">
                                    <MapPin size={16} />
                                    <span>{cinema.address}</span>
                                </div>
                                <div className="meta-line">
                                    <Phone size={16} />
                                    <span>{cinema.phone || 'Đang cập nhật'}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default Cinemas;
