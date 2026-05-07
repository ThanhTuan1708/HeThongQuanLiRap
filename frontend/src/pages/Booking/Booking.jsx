import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CreditCard, ShoppingCart } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Booking.css';

const Booking = () => {
    const { showtimeId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { addToCart } = useCart();

    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [showtimeResponse, seatsResponse] = await Promise.all([
                    api.get(`/showtimes/${showtimeId}`),
                    api.get(`/showtimes/${showtimeId}/seats`)
                ]);

                setShowtime(showtimeResponse.data?.showtime || null);
                setSeats(seatsResponse.data?.seats || []);
            } catch (err) {
                setError('Không thể tải sơ đồ ghế. Suất chiếu có thể không tồn tại.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [showtimeId]);

    const rows = useMemo(() => {
        return seats.reduce((accumulator, seat) => {
            if (!accumulator[seat.row]) accumulator[seat.row] = [];
            accumulator[seat.row].push(seat);
            return accumulator;
        }, {});
    }, [seats]);

    const totalAmount = selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);

    const handleSeatClick = (seat) => {
        if (seat.status !== 'available') return;

        setSelectedSeats((current) => {
            const exists = current.some((item) => item.seatCode === seat.seatCode);
            if (exists) {
                return current.filter((item) => item.seatCode !== seat.seatCode);
            }
            if (current.length >= 8) {
                window.alert('Chỉ được chọn tối đa 8 ghế.');
                return current;
            }
            return [...current, seat];
        });
    };

    const refreshSeats = async () => {
        const seatsResponse = await api.get(`/showtimes/${showtimeId}/seats`);
        setSeats(seatsResponse.data?.seats || []);
    };

    const handleBooking = async (isAddToCart = false) => {
        if (authLoading) return;
        if (!isAuthenticated) {
            window.alert('Vui lòng đăng nhập để đặt vé.');
            navigate('/login', { state: { from: { pathname: `/booking/${showtimeId}` } } });
            return;
        }
        if (selectedSeats.length === 0) return;

        setProcessing(true);
        try {
            const seatCodes = selectedSeats.map((seat) => seat.seatCode);

            await api.post(`/showtimes/${showtimeId}/seat-locks`, { seatCodes });
            const bookingResponse = await api.post('/bookings', { showtimeId, seatCodes });
            const bookingId = bookingResponse.data?.bookingId || bookingResponse.data?.booking?._id;

            if (!bookingId) {
                throw new Error('Không nhận được mã booking.');
            }

            if (isAddToCart) {
                await addToCart(showtimeId, seatCodes);
                window.alert('Đã thêm vào giỏ hàng thành công! Ghế sẽ được giữ trong 10 phút.');
                // Tùy chọn: Chuyển về trang home hoặc để người dùng tiếp tục
                navigate('/ticketing');
            } else {
                navigate(`/checkout/${bookingId}`);
            }
        } catch (err) {
            window.alert(err.message || 'Lỗi khi giữ ghế. Ghế có thể đã bị người khác chọn.');
            await refreshSeats();
            setSelectedSeats([]);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="loader-container">Đang tải sơ đồ rạp...</div>;
    if (error) return <div className="error-message container">{error}</div>;
    if (!showtime) return null;

    return (
        <div className="booking-page container animate-fade-in">
            <button className="btn btn-outline mb-4" onClick={() => navigate(-1)}>
                <ChevronLeft size={16} /> Quay Lại
            </button>

            <div className="booking-layout">
                <div className="seat-selection-wrapper glass-panel">
                    <div className="screen-container">
                        <div className="screen">MÀN HÌNH</div>
                    </div>

                    <div className="seats-container">
                        {Object.keys(rows).sort().map((row) => (
                            <div key={row} className="seat-row">
                                <span className="row-label">{row}</span>
                                {rows[row]
                                    .sort((left, right) => left.col - right.col)
                                    .map((seat) => {
                                        const isSelected = selectedSeats.some((item) => item.seatCode === seat.seatCode);
                                        let seatClass = 'seat';
                                        if (seat.status === 'sold' || seat.status === 'locked' || seat.status === 'inactive') {
                                            seatClass += ' booked';
                                        } else if (isSelected) {
                                            seatClass += ' selected';
                                        } else if (seat.zone === 'vip') {
                                            seatClass += ' vip';
                                        } else if (seat.zone === 'sweetbox') {
                                            seatClass += ' sweetbox';
                                        }

                                        return (
                                            <button
                                                key={seat.seatCode}
                                                className={seatClass}
                                                disabled={seat.status !== 'available'}
                                                onClick={() => handleSeatClick(seat)}
                                                title={`Ghế ${seat.seatCode} - ${seat.price?.toLocaleString('vi-VN')}đ`}
                                            >
                                                {seat.seatCode}
                                            </button>
                                        );
                                    })}
                                <span className="row-label right">{row}</span>
                            </div>
                        ))}
                    </div>

                    <div className="seat-legend mt-4">
                        <div className="legend-item"><div className="seat legend-seat"></div> <span>Thường</span></div>
                        <div className="legend-item"><div className="seat vip legend-seat"></div> <span>VIP</span></div>
                        <div className="legend-item"><div className="seat sweetbox legend-seat"></div> <span>Sweetbox</span></div>
                        <div className="legend-item"><div className="seat selected legend-seat"></div> <span>Đang chọn</span></div>
                        <div className="legend-item"><div className="seat booked legend-seat"></div> <span>Đã đặt</span></div>
                    </div>
                </div>

                <div className="booking-sidebar">
                    <div className="booking-summary glass-panel">
                        <h3 className="summary-title mb-3">Thông Tin Chọn Ghế</h3>

                        <div className="movie-info-sm mb-3">
                            <h4 className="text-white">{showtime.movie?.title}</h4>
                            <p className="text-gray">{showtime.cinema?.name} - {showtime.room?.name}</p>
                            <p className="text-gray">
                                Thời gian: {new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(showtime.startTime).toLocaleDateString('vi-VN')}
                            </p>
                        </div>

                        <div className="divider mb-3"></div>

                        <div className="selected-seats-info mb-3">
                            <p className="text-gray mb-1">Ghế đã chọn:</p>
                            <div className="seat-tags">
                                {selectedSeats.length > 0 ? selectedSeats.map((seat) => (
                                    <span key={seat.seatCode} className="seat-tag">{seat.seatCode}</span>
                                )) : <span className="text-gray italic">Chưa chọn ghế nào</span>}
                            </div>
                        </div>

                        <div className="divider mb-3"></div>

                        <div className="total-amount-box mb-4">
                            <span className="text-gray">Tạm tính:</span>
                            <span className="total-price text-primary">{totalAmount.toLocaleString('vi-VN')} đ</span>
                        </div>

                        <div className="action-buttons flex gap-2">
                            <button className="btn btn-outline flex-1 flex items-center justify-center gap-2" disabled={selectedSeats.length === 0 || processing} onClick={() => handleBooking(true)}>
                                <ShoppingCart size={20} />
                                {processing ? 'Đang...' : 'Thêm Vào Giỏ'}
                            </button>
                            <button className="btn btn-primary flex-1 flex items-center justify-center gap-2" disabled={selectedSeats.length === 0 || processing} onClick={() => handleBooking(false)}>
                                <CreditCard size={20} />
                                {processing ? 'Đang xử lý...' : 'Thanh Toán Ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Booking;
