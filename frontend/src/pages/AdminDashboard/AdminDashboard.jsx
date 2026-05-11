import React, { useEffect, useState } from 'react';
import {
    BarChart3,
    Building2,
    CalendarClock,
    ClipboardList,
    CreditCard,
    Film,
    LayoutGrid,
    MapPinned,
    RefreshCw,
    Tags,
    Ticket,
    Trash2
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const defaultStats = {
    movies: 0,
    showtimes: 0,
    bookings: 0,
    tickets: 0,
    totalRevenue: 0,
    todayRevenue: 0
};

const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { key: 'movies', label: 'Phim', icon: Film },
    { key: 'cinemas', label: 'Chi nhánh rạp', icon: MapPinned },
    { key: 'rooms', label: 'Phòng chiếu', icon: Building2 },
    { key: 'seatTypes', label: 'Loại ghế', icon: LayoutGrid },
    { key: 'showtimes', label: 'Suất chiếu', icon: CalendarClock },
    { key: 'promotions', label: 'Khuyến mãi', icon: Tags },
    { key: 'bookings', label: 'Đơn đặt vé', icon: ClipboardList },
    { key: 'revenue', label: 'Doanh thu', icon: CreditCard }
];

const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
const formatDateTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : 'Đang cập nhật';

const DataPanel = ({ title, subtitle, rows, columns, emptyMessage, actions }) => (
    <div className="glass-panel admin-panel">
        <div className="panel-head">
            <div>
                <h2>{title}</h2>
                {subtitle ? <p>{subtitle}</p> : null}
            </div>
            {actions}
        </div>

        {rows.length > 0 ? (
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key}>{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row._id || row.id || index}>
                                {columns.map((column) => (
                                    <td key={column.key}>{column.render(row)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="empty-admin-state">{emptyMessage}</div>
        )}
    </div>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(defaultStats);
    const [movies, setMovies] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [showtimeReport, setShowtimeReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyTab, setBusyTab] = useState('');
    const [message, setMessage] = useState('');

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [
                dashboardResponse,
                moviesResponse,
                cinemasResponse,
                roomsResponse,
                seatTypesResponse,
                showtimesResponse,
                promotionsResponse,
                bookingsResponse,
                revenueResponse,
                showtimeReportResponse
            ] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/movies?limit=50'),
                api.get('/cinemas'),
                api.get('/rooms'),
                api.get('/seat-types?all=true'),
                api.get('/showtimes'),
                api.get('/promotions'),
                api.get('/admin/bookings?limit=50'),
                api.get('/admin/revenue'),
                api.get('/admin/showtimes/report')
            ]);

            setStats(dashboardResponse?.data?.stats || defaultStats);
            setMovies(moviesResponse?.data?.movies || []);
            setCinemas(cinemasResponse?.data?.cinemas || []);
            setRooms(roomsResponse?.data?.rooms || []);
            setSeatTypes(seatTypesResponse?.data?.seatTypes || []);
            setShowtimes(showtimesResponse?.data?.showtimes || []);
            setPromotions(promotionsResponse?.data?.promotions || []);
            setBookings(bookingsResponse?.data?.bookings || []);
            setRevenue(revenueResponse?.data?.revenue || []);
            setShowtimeReport(showtimeReportResponse?.data?.report || []);
            setMessage('');
        } catch (err) {
            setMessage(err.message || 'Không thể tải dữ liệu quản trị.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const withRefresh = async (tabKey, callback, successMessage) => {
        try {
            setBusyTab(tabKey);
            await callback();
            await fetchAll();
            setMessage(successMessage);
        } catch (err) {
            setMessage(err.message || 'Thao tác không thành công.');
        } finally {
            setBusyTab('');
        }
    };

    const overview = (
        <>
            <section className="stats-grid">
                <article className="stat-card glass-panel">
                    <span>Phim đang khai thác</span>
                    <strong>{stats.movies}</strong>
                </article>
                <article className="stat-card glass-panel">
                    <span>Suất chiếu đang mở</span>
                    <strong>{stats.showtimes}</strong>
                </article>
                <article className="stat-card glass-panel">
                    <span>Booking thành công</span>
                    <strong>{stats.bookings}</strong>
                </article>
                <article className="stat-card glass-panel">
                    <span>Vé đã phát hành</span>
                    <strong>{stats.tickets}</strong>
                </article>
                <article className="stat-card glass-panel revenue">
                    <span>Doanh thu hôm nay</span>
                    <strong>{formatCurrency(stats.todayRevenue)}</strong>
                </article>
                <article className="stat-card glass-panel revenue">
                    <span>Tổng doanh thu</span>
                    <strong>{formatCurrency(stats.totalRevenue)}</strong>
                </article>
            </section>

            <DataPanel
                title="Báo cáo suất chiếu"
                subtitle="Tỷ lệ lấp đầy ghế theo từng suất chiếu đang là một phần trọng tâm của sơ đồ use case."
                rows={showtimeReport}
                emptyMessage="Chưa có dữ liệu báo cáo suất chiếu."
                columns={[
                    { key: 'movie', label: 'Phim', render: (row) => row.movie },
                    { key: 'cinema', label: 'Rạp', render: (row) => row.cinema },
                    { key: 'startTime', label: 'Bắt đầu', render: (row) => formatDateTime(row.startTime) },
                    { key: 'ticketsSold', label: 'Đã bán', render: (row) => `${row.ticketsSold}/${row.totalSeats}` },
                    { key: 'occupancyRate', label: 'Lấp đầy', render: (row) => `${row.occupancyRate}%` }
                ]}
                actions={
                    <button className="btn btn-outline btn-sm" onClick={fetchAll}>
                        <RefreshCw size={16} /> Làm mới
                    </button>
                }
            />
        </>
    );

    const moviesPanel = (
        <DataPanel
            title="Quản lý phim"
            subtitle="Danh sách phim hiện có trong hệ thống."
            rows={movies}
            emptyMessage="Chưa có phim nào."
            columns={[
                { key: 'title', label: 'Tên phim', render: (row) => row.title },
                { key: 'status', label: 'Trạng thái', render: (row) => row.status },
                { key: 'duration', label: 'Thời lượng', render: (row) => `${row.durationMinutes} phút` },
                { key: 'genre', label: 'Thể loại', render: (row) => row.genre?.join(', ') || 'N/A' },
                {
                    key: 'action',
                    label: 'Thao tác',
                    render: (row) => (
                        row.status === 'ended' ? (
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={busyTab === 'movies'}
                                onClick={() => withRefresh('movies', () => api.put(`/movies/${row._id}`, { status: 'now_showing' }), 'Đã hiện phim.')}
                            >
                                <RefreshCw size={14} /> Hiện
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline btn-sm danger-outline"
                                disabled={busyTab === 'movies'}
                                onClick={() => withRefresh('movies', () => api.delete(`/movies/${row._id}`), 'Đã cập nhật trạng thái phim.')}
                            >
                                <Trash2 size={14} /> Ẩn
                            </button>
                        )
                    )
                }
            ]}
        />
    );

    const cinemasPanel = (
        <DataPanel
            title="Quản lý chi nhánh rạp"
            subtitle="Quản lý thông tin và trạng thái hoạt động của các cụm rạp."
            rows={cinemas}
            emptyMessage="Chưa có cụm rạp nào."
            columns={[
                { key: 'name', label: 'Tên rạp', render: (row) => row.name },
                { key: 'city', label: 'Thành phố', render: (row) => row.city },
                { key: 'address', label: 'Địa chỉ', render: (row) => row.address },
                { key: 'status', label: 'Trạng thái', render: (row) => row.status },
                {
                    key: 'action',
                    label: 'Thao tác',
                    render: (row) => (
                        row.status === 'inactive' ? (
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={busyTab === 'cinemas'}
                                onClick={() => withRefresh('cinemas', () => api.put(`/cinemas/${row._id}`, { status: 'active' }), 'Đã khôi phục hoạt động rạp.')}
                            >
                                <RefreshCw size={14} /> Hoạt động
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline btn-sm danger-outline"
                                disabled={busyTab === 'cinemas'}
                                onClick={() => withRefresh('cinemas', () => api.delete(`/cinemas/${row._id}`), 'Đã cập nhật trạng thái chi nhánh rạp.')}
                            >
                                <Trash2 size={14} /> Vô hiệu
                            </button>
                        )
                    )
                }
            ]}
        />
    );

    const roomsPanel = (
        <DataPanel
            title="Quản lý phòng chiếu"
            subtitle="Theo dõi phòng chiếu, màn hình và số lượng ghế."
            rows={rooms}
            emptyMessage="Chưa có phòng chiếu nào."
            columns={[
                { key: 'name', label: 'Phòng', render: (row) => row.name },
                { key: 'cinema', label: 'Rạp', render: (row) => row.cinema?.name || 'N/A' },
                { key: 'screenType', label: 'Loại màn', render: (row) => row.screenType },
                { key: 'totalSeats', label: 'Số ghế', render: (row) => row.totalSeats || row.seatLayout?.length || 0 },
                {
                    key: 'action',
                    label: 'Thao tác',
                    render: (row) => (
                        row.status === 'inactive' ? (
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={busyTab === 'rooms'}
                                onClick={() => withRefresh('rooms', () => api.put(`/rooms/${row._id}`, { status: 'active' }), 'Đã khôi phục hoạt động phòng chiếu.')}
                            >
                                <RefreshCw size={14} /> Hoạt động
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline btn-sm danger-outline"
                                disabled={busyTab === 'rooms'}
                                onClick={() => withRefresh('rooms', () => api.delete(`/rooms/${row._id}`), 'Đã vô hiệu phòng chiếu.')}
                            >
                                <Trash2 size={14} /> Vô hiệu
                            </button>
                        )
                    )
                }
            ]}
        />
    );

    const seatTypesPanel = (
        <DataPanel
            title="Quản lý loại ghế"
            subtitle="Các loại ghế đang được sử dụng để tính giá và sơ đồ ghế."
            rows={seatTypes}
            emptyMessage="Chưa có loại ghế nào."
            columns={[
                { key: 'name', label: 'Loại ghế', render: (row) => row.name },
                { key: 'code', label: 'Mã', render: (row) => row.code },
                { key: 'surcharge', label: 'Phụ thu', render: (row) => formatCurrency(row.baseSurcharge) },
                {
                    key: 'action',
                    label: 'Thao tác',
                    render: (row) => (
                        !row.isActive ? (
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={busyTab === 'seatTypes'}
                                onClick={() => withRefresh('seatTypes', () => api.put(`/seat-types/${row._id}`, { isActive: true }), 'Đã khôi phục hoạt động loại ghế.')}
                            >
                                <RefreshCw size={14} /> Hoạt động
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline btn-sm danger-outline"
                                disabled={busyTab === 'seatTypes'}
                                onClick={() => withRefresh('seatTypes', () => api.delete(`/seat-types/${row._id}`), 'Đã vô hiệu loại ghế.')}
                            >
                                <Trash2 size={14} /> Vô hiệu
                            </button>
                        )
                    )
                }
            ]}
        />
    );

    const showtimesPanel = (
        <DataPanel
            title="Quản lý suất chiếu"
            subtitle="Danh sách suất chiếu và khả năng đóng/hủy suất nếu cần."
            rows={showtimes}
            emptyMessage="Chưa có suất chiếu nào."
            columns={[
                { key: 'movie', label: 'Phim', render: (row) => row.movie?.title || 'N/A' },
                { key: 'cinema', label: 'Rạp', render: (row) => row.cinema?.name || 'N/A' },
                { key: 'room', label: 'Phòng', render: (row) => row.room?.name || 'N/A' },
                { key: 'startTime', label: 'Bắt đầu', render: (row) => formatDateTime(row.startTime) },
                {
                    key: 'action',
                    label: 'Thao tác',
                    render: (row) => (
                        row.status === 'cancelled' ? (
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={busyTab === 'showtimes'}
                                onClick={() => withRefresh('showtimes', () => api.put(`/showtimes/${row._id}`, { status: 'open' }), 'Đã khôi phục suất chiếu.')}
                            >
                                <RefreshCw size={14} /> Khôi phục
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline btn-sm danger-outline"
                                disabled={busyTab === 'showtimes'}
                                onClick={() => withRefresh('showtimes', () => api.delete(`/showtimes/${row._id}`), 'Đã hủy suất chiếu.')}
                            >
                                <Trash2 size={14} /> Hủy suất
                            </button>
                        )
                    )
                }
            ]}
        />
    );

    const promotionsPanel = (
        <DataPanel
            title="Quản lý khuyến mãi"
            subtitle="Theo dõi mã giảm giá, giới hạn sử dụng và thời gian hiệu lực."
            rows={promotions}
            emptyMessage="Chưa có khuyến mãi nào."
            columns={[
                { key: 'code', label: 'Mã', render: (row) => row.code },
                { key: 'name', label: 'Tên', render: (row) => row.name },
                { key: 'discount', label: 'Ưu đãi', render: (row) => row.discountType === 'percent' ? `${row.discountValue}%` : formatCurrency(row.discountValue) },
                { key: 'validTo', label: 'Hiệu lực đến', render: (row) => formatDateTime(row.validTo) },
                {
                    key: 'action',
                    label: 'Thao tác',
                    render: (row) => (
                        row.status === 'inactive' || row.status === 'expired' ? (
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={busyTab === 'promotions'}
                                onClick={() => withRefresh('promotions', () => api.put(`/promotions/${row._id}`, { status: 'active' }), 'Đã khôi phục khuyến mãi.')}
                            >
                                <RefreshCw size={14} /> Hoạt động
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline btn-sm danger-outline"
                                disabled={busyTab === 'promotions'}
                                onClick={() => withRefresh('promotions', () => api.delete(`/promotions/${row._id}`), 'Đã vô hiệu khuyến mãi.')}
                            >
                                <Trash2 size={14} /> Vô hiệu
                            </button>
                        )
                    )
                }
            ]}
        />
    );

    const bookingsPanel = (
        <DataPanel
            title="Quản lý đơn đặt vé"
            subtitle="Danh sách booking toàn hệ thống để theo dõi trạng thái thanh toán và khách hàng."
            rows={bookings}
            emptyMessage="Chưa có booking nào."
            columns={[
                { key: 'code', label: 'Mã booking', render: (row) => row.bookingCode },
                { key: 'user', label: 'Khách hàng', render: (row) => row.user?.fullName || 'N/A' },
                { key: 'movie', label: 'Phim', render: (row) => row.showtime?.movie?.title || 'N/A' },
                { key: 'status', label: 'Trạng thái', render: (row) => row.status },
                { key: 'total', label: 'Tổng tiền', render: (row) => formatCurrency(row.totalAmount) }
            ]}
        />
    );

    const revenuePanel = (
        <div className="admin-two-column">
            <DataPanel
                title="Thống kê doanh thu"
                subtitle="Tổng hợp doanh thu theo thời gian từ các giao dịch hoàn tất."
                rows={revenue}
                emptyMessage="Chưa có dữ liệu doanh thu."
                columns={[
                    { key: 'time', label: 'Mốc thời gian', render: (row) => row._id },
                    { key: 'count', label: 'Số giao dịch', render: (row) => row.count },
                    { key: 'revenue', label: 'Doanh thu', render: (row) => formatCurrency(row.totalRevenue) }
                ]}
            />
            <div className="glass-panel admin-panel revenue-summary">
                <h2>Tóm tắt tài chính</h2>
                <div className="summary-row">
                    <span>Doanh thu hôm nay</span>
                    <strong>{formatCurrency(stats.todayRevenue)}</strong>
                </div>
                <div className="summary-row">
                    <span>Tổng doanh thu</span>
                    <strong>{formatCurrency(stats.totalRevenue)}</strong>
                </div>
                <div className="summary-row">
                    <span>Booking đã thanh toán</span>
                    <strong>{stats.bookings}</strong>
                </div>
                <div className="summary-row">
                    <span>Vé đang hoạt động</span>
                    <strong>{stats.tickets}</strong>
                </div>
            </div>
        </div>
    );

    const panelByTab = {
        overview,
        movies: moviesPanel,
        cinemas: cinemasPanel,
        rooms: roomsPanel,
        seatTypes: seatTypesPanel,
        showtimes: showtimesPanel,
        promotions: promotionsPanel,
        bookings: bookingsPanel,
        revenue: revenuePanel
    };

    return (
        <div className="admin-dashboard container animate-fade-in">
            <section className="admin-hero glass-panel">
                <div>
                    <p className="admin-kicker">KHU VỰC QUẢN TRỊ VIÊN</p>
                    <h1>Bảng điều khiển hệ thống rạp chiếu</h1>
                    <p className="admin-subtitle">
                        Tài khoản <strong>{user?.fullName}</strong> đang có quyền quản trị viên. Khu vực này bám theo sơ đồ use case
                        để quản lý phim, chi nhánh, phòng chiếu, loại ghế, suất chiếu, khuyến mãi, đơn đặt vé và doanh thu.
                    </p>
                </div>
                <div className="admin-role-card">
                    <ClipboardList size={28} />
                    <div>
                        <span>Vai trò đăng nhập</span>
                        <strong>Quản trị viên</strong>
                    </div>
                </div>
            </section>

            {message ? <div className="profile-message">{message}</div> : null}
            {loading ? <div className="loader-container">Đang tải dữ liệu quản trị...</div> : null}

            {!loading ? (
                <>
                    <div className="admin-tabs">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                className={`admin-tab ${activeTab === key ? 'active' : ''}`}
                                onClick={() => setActiveTab(key)}
                            >
                                <Icon size={16} /> {label}
                            </button>
                        ))}
                    </div>

                    {panelByTab[activeTab]}
                </>
            ) : null}
        </div>
    );
};

export default AdminDashboard;
