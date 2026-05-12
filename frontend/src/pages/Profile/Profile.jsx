import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, Download, LogOut, ShieldCheck, Ticket, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';
import TicketQrCode from '../../components/tickets/TicketQrCode';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const customerFeatures = [
    'Xem phim, chọn suất chiếu và đặt ghế.',
    'Thanh toán booking và sử dụng mã khuyến mãi.',
    'Xem lịch sử đặt vé cá nhân trong tài khoản.'
];

const adminFeatures = [
    'Truy cập bảng điều khiển quản trị.',
    'Xem thống kê booking, vé, suất chiếu và doanh thu.',
    'Theo dõi các chức năng vận hành dành cho quản trị viên.'
];

const formatCurrency = (value) => {
    if (typeof value !== 'number') return '0 đ';
    return `${value.toLocaleString('vi-VN')} đ`;
};

const getTicketStatusText = (status) => {
    switch (status) {
    case 'active':
        return 'Còn hiệu lực';
    case 'used':
        return 'Đã sử dụng';
    case 'cancelled':
        return 'Đã hủy';
    case 'expired':
        return 'Hết hạn';
    default:
        return status || 'Đang cập nhật';
    }
};

const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const Profile = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBookingId, setExpandedBookingId] = useState('');
    const [ticketMap, setTicketMap] = useState({});
    const [actionMessage, setActionMessage] = useState('');
    const isAdmin = user?.role === 'admin';

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings/my');
            setBookings(response?.data?.bookings || []);
        } catch (err) {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || isAdmin) {
            setLoading(false);
            return;
        }

        fetchBookings();
    }, [isAdmin, isAuthenticated]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const getStatusBadge = (status) => {
        switch (status) {
        case 'paid':
            return <span className="badge badge-success">Đã thanh toán</span>;
        case 'pending_payment':
            return <span className="badge badge-warning">Chờ thanh toán</span>;
        case 'cancelled':
            return <span className="badge badge-danger">Đã hủy</span>;
        case 'expired':
            return <span className="badge badge-danger">Hết hạn</span>;
        default:
            return <span className="badge">{status}</span>;
        }
    };

    const handleToggleBookingDetail = async (bookingId) => {
        if (expandedBookingId === bookingId) {
            setExpandedBookingId('');
            return;
        }

        setExpandedBookingId(bookingId);
        if (!ticketMap[bookingId]) {
            try {
                const response = await api.get(`/tickets/booking/${bookingId}`);
                setTicketMap((prev) => ({
                    ...prev,
                    [bookingId]: response?.data?.tickets || []
                }));
            } catch (err) {
                setTicketMap((prev) => ({ ...prev, [bookingId]: [] }));
            }
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            await api.patch(`/bookings/${bookingId}/cancel`);
            setActionMessage('Đã hủy booking thành công.');
            await fetchBookings();
        } catch (err) {
            setActionMessage(err.message || 'Không thể hủy booking.');
        }
    };

    const getTicketDiscountAmount = (booking, ticket) => {
        if (!booking?.discountAmount || !booking?.subtotal || !ticket?.price) return 0;
        return Math.round((booking.discountAmount * ticket.price) / booking.subtotal);
    };

    const getTicketFinalAmount = (booking, ticket) => {
        return Math.max((ticket?.price || 0) - getTicketDiscountAmount(booking, ticket), 0);
    };

    const handleSaveTicket = (booking, ticket) => {
        const movieTitle = booking.showtime?.movie?.title || 'Đang cập nhật';
        const cinemaName = booking.showtime?.cinema?.name || 'Đang cập nhật';
        const roomName = booking.showtime?.room?.name || 'Đang cập nhật';
        const showtimeText = booking.showtime?.startTime ? new Date(booking.showtime.startTime).toLocaleString('vi-VN') : 'Đang cập nhật';
        const discountAmount = getTicketDiscountAmount(booking, ticket);
        const finalAmount = getTicketFinalAmount(booking, ticket);
        const fileName = `${booking.bookingCode}-${ticket.seatCode}.html`.replace(/[^a-zA-Z0-9._-]/g, '-');
        const ticketHtml = `<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <title>Vé ${escapeHtml(movieTitle)} - Ghế ${escapeHtml(ticket.seatCode)}</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; background: #111; color: #fff; }
        .ticket { max-width: 520px; margin: 24px auto; padding: 24px; border: 1px solid #333; border-radius: 12px; background: #1b1b1b; }
        h1 { margin: 0 0 8px; font-size: 24px; }
        .muted { color: #aaa; }
        .qr-code { padding: 16px; margin: 18px 0; border-radius: 12px; background: #fff; color: #111; word-break: break-all; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .item { padding: 12px; border: 1px solid #333; border-radius: 8px; }
        .item span { display: block; color: #aaa; font-size: 12px; margin-bottom: 5px; }
        .total { color: #e50914; font-size: 20px; }
        @media print { body { background: #fff; color: #111; } .ticket { border-color: #ddd; background: #fff; } .muted, .item span { color: #555; } }
    </style>
</head>
<body>
    <main class="ticket">
        <p class="muted">Lotte Cinema</p>
        <h1>${escapeHtml(movieTitle)}</h1>
        <p class="muted">Mã đơn hàng: ${escapeHtml(booking.bookingCode)}</p>
        <div class="qr-code"><strong>Mã QR quét vé:</strong><br />${escapeHtml(ticket.qrCode)}</div>
        <div class="grid">
            <div class="item"><span>Rạp / Phòng</span><strong>${escapeHtml(cinemaName)} - ${escapeHtml(roomName)}</strong></div>
            <div class="item"><span>Suất chiếu</span><strong>${escapeHtml(showtimeText)}</strong></div>
            <div class="item"><span>Ghế</span><strong>${escapeHtml(ticket.seatCode)}</strong></div>
            <div class="item"><span>Loại ghế</span><strong>${escapeHtml(ticket.seatType?.name || 'Đang cập nhật')}</strong></div>
            <div class="item"><span>Giá gốc</span><strong>${escapeHtml(formatCurrency(ticket.price || 0))}</strong></div>
            <div class="item"><span>Giảm giá</span><strong>${escapeHtml(formatCurrency(discountAmount))}</strong></div>
            <div class="item"><span>Thành tiền</span><strong class="total">${escapeHtml(formatCurrency(finalAmount))}</strong></div>
            <div class="item"><span>Trạng thái</span><strong>${escapeHtml(getTicketStatusText(ticket.status))}</strong></div>
        </div>
    </main>
</body>
</html>`;

        const blob = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="profile-page container animate-fade-in">
            <h1 className="mb-4">Tài Khoản Của Tôi</h1>

            <div className="profile-layout">
                <div className="profile-sidebar glass-panel">
                    <div className="user-avatar mb-3">
                        <div className="avatar-circle">
                            <UserIcon size={40} />
                        </div>
                    </div>
                    <h3 className="text-center mb-1">{user?.fullName}</h3>
                    <p className="text-center text-gray mb-2">{user?.email}</p>
                    <p className="text-center text-secondary mb-4">{isAdmin ? 'Quản trị viên' : 'Khách hàng'}</p>

                    <ul className="profile-menu">
                        <li className="active">
                            {isAdmin ? <ShieldCheck size={18} /> : <Ticket size={18} />}
                            {isAdmin ? 'Thông tin phân quyền' : 'Lịch sử đặt vé'}
                        </li>
                        <li className="text-danger mt-auto" onClick={logout} style={{ cursor: 'pointer', marginTop: '20px' }}>
                            <LogOut size={18} /> Đăng xuất
                        </li>
                    </ul>
                </div>

                <div className="profile-content glass-panel">
                    <h3 className="mb-4 border-bottom pb-2">
                        {isAdmin ? 'Chức Năng Theo Vai Trò' : 'Lịch Sử Vé Phim'}
                    </h3>

                    {actionMessage ? <div className="profile-message">{actionMessage}</div> : null}
                    {loading ? <div className="text-center py-4">Đang tải dữ liệu tài khoản...</div> : null}

                    {!loading && isAdmin ? (
                        <div className="bookings-list">
                            <div className="booking-card">
                                <div className="bk-info">
                                    <div className="bk-header">
                                        <h4>Chức năng riêng của quản trị viên</h4>
                                        <span className="badge badge-success">Admin</span>
                                    </div>
                                    {adminFeatures.map((feature) => (
                                        <p key={feature} className="mb-2">{feature}</p>
                                    ))}
                                    <Link to="/admin" className="btn btn-primary btn-sm mt-2" style={{ width: 'fit-content' }}>
                                        <ShieldCheck size={16} /> Mở bảng quản trị
                                    </Link>
                                </div>
                            </div>

                            <div className="booking-card">
                                <div className="bk-info">
                                    <div className="bk-header">
                                        <h4>Chức năng của user khách hàng</h4>
                                        <span className="badge badge-warning">Customer</span>
                                    </div>
                                    {customerFeatures.map((feature) => (
                                        <p key={feature} className="mb-2">{feature}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {!loading && !isAdmin && bookings.length > 0 ? (
                        <div className="bookings-list">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="booking-card">
                                    <div className="bk-poster">
                                        <img src={booking.showtime?.movie?.posterUrl || 'https://placehold.co/150x225/1E1E1E/E50914?text=Movie'} alt="poster" />
                                    </div>
                                    <div className="bk-info">
                                        <div className="bk-header">
                                            <h4>{booking.showtime?.movie?.title || 'Phim đã bị xóa'}</h4>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                        <p className="text-gray mb-1">
                                            {booking.showtime?.cinema?.name} - {booking.showtime?.room?.name}
                                        </p>
                                        <p className="mb-2">
                                            Thời gian: <strong className="text-white">{booking.showtime?.startTime ? new Date(booking.showtime.startTime).toLocaleString('vi-VN') : 'Đang cập nhật'}</strong>
                                        </p>
                                        <p className="mb-2">
                                            Ghế: <strong className="text-primary">{booking.seatCodes?.join(', ')}</strong>
                                        </p>
                                        <div className="bk-footer mt-auto">
                                            <div>Mã vé: <strong className="text-white">{booking.bookingCode}</strong></div>
                                            <div className="bk-total">Tổng tiền: <strong className="text-primary">{booking.totalAmount?.toLocaleString('vi-VN')}đ</strong></div>
                                        </div>

                                        <div className="booking-actions">
                                            <button className="btn btn-outline btn-sm" onClick={() => handleToggleBookingDetail(booking._id)}>
                                                <ChevronDown size={16} /> Xem chi tiết vé
                                            </button>
                                            {booking.status === 'pending_payment' ? (
                                                <>
                                                    <Link to={`/checkout/${booking._id}`} className="btn btn-outline btn-sm">
                                                        Thanh toán ngay
                                                    </Link>
                                                    <button className="btn btn-outline btn-sm danger-outline" onClick={() => handleCancelBooking(booking._id)}>
                                                        Hủy booking
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>

                                        {expandedBookingId === booking._id ? (
                                            <div className="ticket-detail-box">
                                                {(ticketMap[booking._id] || []).length > 0 ? (
                                                    <div className="ticket-grid">
                                                        {(ticketMap[booking._id] || []).map((ticket) => (
                                                            <div key={ticket._id} className="ticket-item">
                                                                <div className="ticket-meta">
                                                                    <div className="history-seat-code">
                                                                        <span>Ghế</span>
                                                                        <strong>{ticket.seatCode}</strong>
                                                                    </div>
                                                                    <div className="history-ticket-grid">
                                                                        <div>
                                                                            <span>Loại ghế</span>
                                                                            <strong>{ticket.seatType?.name || 'Đang cập nhật'}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span>Giá gốc</span>
                                                                            <strong>{formatCurrency(ticket.price || 0)}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span>Giảm giá</span>
                                                                            <strong>{formatCurrency(getTicketDiscountAmount(booking, ticket))}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span>Thành tiền</span>
                                                                            <strong className="history-final-price">{formatCurrency(getTicketFinalAmount(booking, ticket))}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span>Trạng thái</span>
                                                                            <strong>{getTicketStatusText(ticket.status)}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span>Mã QR quét vé</span>
                                                                            <strong>{ticket.qrCode}</strong>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="history-ticket-actions">
                                                                    <TicketQrCode value={ticket.qrCode} title={`QR quét vé - ${booking.showtime?.movie?.title || 'vé'} - ghế ${ticket.seatCode}`} />
                                                                    <button className="btn btn-outline btn-sm" type="button" onClick={() => handleSaveTicket(booking, ticket)}>
                                                                        <Download size={15} /> Lưu vé
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray">Booking này chưa có vé phát hành hoặc chưa thanh toán.</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {!loading && !isAdmin && bookings.length === 0 ? (
                        <div className="text-center py-5 text-gray">
                            <Ticket size={50} style={{ opacity: 0.5, margin: '0 auto 15px' }} />
                            <p>Bạn chưa có lịch sử đặt vé nào.</p>
                            <Link to="/" className="btn btn-primary mt-3">Mua Vé Ngay</Link>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default Profile;
