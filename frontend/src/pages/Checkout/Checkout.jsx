import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Download, RefreshCw, Tag } from 'lucide-react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import TicketQrCode from '../../components/tickets/TicketQrCode';
import './Checkout.css';

const createRandomPaymentCode = (provider, bookingCode) => {
    const prefix = provider.toUpperCase();
    const bookingPart = (bookingCode || 'BOOKING').slice(-6).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    const timePart = Date.now().toString().slice(-6);
    return `${prefix}-${bookingPart}-${timePart}-${randomPart}`;
};

const formatCurrency = (value) => {
    if (typeof value !== 'number') return '0 đ';
    return `${value.toLocaleString('vi-VN')} đ`;
};

const formatDateTime = (value) => {
    if (!value) return 'Đang cập nhật';
    return new Date(value).toLocaleString('vi-VN');
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

const QR_SIZE = 21;

const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const isFinderCell = (row, col, originRow, originCol) => {
    const localRow = row - originRow;
    const localCol = col - originCol;
    if (localRow < 0 || localRow > 6 || localCol < 0 || localCol > 6) return false;

    const outer = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
    const inner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
    return outer || inner;
};

const createQrSvgMarkup = (value) => {
    const qrValue = value || 'EMPTY_QR';
    let seed = 0;
    for (let index = 0; index < qrValue.length; index += 1) {
        seed = (seed * 31 + qrValue.charCodeAt(index)) >>> 0;
    }

    const nextBit = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed >>> 30) & 1;
    };

    const cells = [];
    for (let row = 0; row < QR_SIZE; row += 1) {
        for (let col = 0; col < QR_SIZE; col += 1) {
            const inFinder = isFinderCell(row, col, 0, 0)
                || isFinderCell(row, col, 0, QR_SIZE - 7)
                || isFinderCell(row, col, QR_SIZE - 7, 0);
            const filled = inFinder || (row === 6 || col === 6 ? (row + col) % 2 === 0 : nextBit() === 1);
            if (filled) {
                cells.push(`<rect x="${col}" y="${row}" width="1" height="1" fill="#111111" />`);
            }
        }
    }

    return `<svg viewBox="0 0 ${QR_SIZE} ${QR_SIZE}" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
        <rect width="${QR_SIZE}" height="${QR_SIZE}" fill="#ffffff" rx="1.2" />
        ${cells.join('')}
    </svg>`;
};

const Checkout = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Support multiple bookings
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentProvider, setPaymentProvider] = useState('vnpay');
    const [paymentQrCode, setPaymentQrCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [promotionCode, setPromotionCode] = useState('');
    const [promotionMessage, setPromotionMessage] = useState('');
    const [applyingPromotion, setApplyingPromotion] = useState(false);

    const fetchTickets = useCallback(async (bIds) => {
        try {
            // Fetch tickets for all bookings
            const allTickets = [];
            for (const bId of bIds) {
                try {
                    const response = await api.get(`/tickets/booking/${bId}`);
                    if (response?.data?.tickets) {
                        allTickets.push(...response.data.tickets);
                    }
                } catch (e) {
                    // ignore individual errors
                }
            }
            setTickets(allTickets);
        } catch {
            setTickets([]);
        }
    }, []);

    const fetchBooking = useCallback(async () => {
        try {
            const bIds = location.state?.bookingIds || [bookingId];
            const fetchedBookings = [];
            let allPaid = true;

            for (const bId of bIds) {
                const response = await api.get(`/bookings/${bId}`);
                const currentBooking = response?.data?.booking;
                if (currentBooking) {
                    fetchedBookings.push(currentBooking);
                    if (currentBooking.status !== 'paid') {
                        allPaid = false;
                    }
                }
            }

            setBookings(fetchedBookings);
            // We only support promo code for the first booking for now, or disable it for multi-booking
            setPromotionCode(fetchedBookings[0]?.promotionCode || '');
            setError('');

            if (allPaid || searchParams.get('payment') === 'success') {
                await fetchTickets(fetchedBookings.map(b => b._id));
            }
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi tải hóa đơn.');
        } finally {
            setLoading(false);
        }
    }, [bookingId, location.state, searchParams, fetchTickets]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    const primaryBooking = bookings[0] || null;

    useEffect(() => {
        if (!primaryBooking || primaryBooking.status === 'paid' || primaryBooking.status === 'cancelled') {
            return;
        }

        setPaymentQrCode(createRandomPaymentCode(paymentProvider, primaryBooking.bookingCode));
    }, [paymentProvider, primaryBooking]);

    const refreshPaymentQr = () => {
        if (!primaryBooking) return;
        setPaymentQrCode(createRandomPaymentCode(paymentProvider, primaryBooking.bookingCode));
    };

    const getTicketDiscountAmount = (ticket, ticketBooking) => {
        if (!ticketBooking?.discountAmount || !ticketBooking?.subtotal || !ticket?.price) return 0;
        return Math.round((ticketBooking.discountAmount * ticket.price) / ticketBooking.subtotal);
    };

    const getTicketFinalAmount = (ticket, ticketBooking) => {
        return Math.max((ticket?.price || 0) - getTicketDiscountAmount(ticket, ticketBooking), 0);
    };

    const handleSaveTicket = (ticket) => {
        const ticketBooking = bookings.find(b => b._id.toString() === ticket.booking.toString()) || primaryBooking;
        const movieTitle = ticketBooking.showtime?.movie?.title || 'Đang cập nhật';
        const cinemaName = ticketBooking.showtime?.cinema?.name || 'Đang cập nhật';
        const roomName = ticketBooking.showtime?.room?.name || 'Đang cập nhật';
        const showtimeText = formatDateTime(ticketBooking.showtime?.startTime);
        const discountAmount = getTicketDiscountAmount(ticket, ticketBooking);
        const finalAmount = getTicketFinalAmount(ticket, ticketBooking);
        const fileName = `${ticketBooking.bookingCode}-${ticket.seatCode}.html`.replace(/[^a-zA-Z0-9._-]/g, '-');

        const ticketHtml = `<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vé ${escapeHtml(movieTitle)} - Ghế ${escapeHtml(ticket.seatCode)}</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; background: #111; color: #fff; }
        .ticket { max-width: 520px; margin: 24px auto; padding: 24px; border: 1px solid #333; border-radius: 12px; background: #1b1b1b; }
        h1 { margin: 0 0 8px; font-size: 24px; }
        .muted { color: #aaa; }
        .qr { margin: 18px 0; padding: 16px; width: fit-content; background: #fff; border-radius: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .item { padding: 12px; border: 1px solid #333; border-radius: 8px; }
        .item span { display: block; color: #aaa; font-size: 12px; margin-bottom: 5px; }
        .item strong { word-break: break-word; }
        .total { color: #e50914; font-size: 20px; }
        @media print { body { background: #fff; color: #111; } .ticket { border-color: #ddd; background: #fff; } .muted, .item span { color: #555; } }
    </style>
</head>
<body>
    <main class="ticket">
        <p class="muted">Lotte Cinema</p>
        <h1>${escapeHtml(movieTitle)}</h1>
        <p class="muted">Mã đơn hàng: ${escapeHtml(ticketBooking.bookingCode)}</p>
        <div class="qr">${createQrSvgMarkup(ticket.qrCode)}</div>
        <p><strong>Mã QR quét vé:</strong> ${escapeHtml(ticket.qrCode)}</p>
        <div class="grid">
            <div class="item"><span>Rạp / Phòng</span><strong>${escapeHtml(cinemaName)} - ${escapeHtml(roomName)}</strong></div>
            <div class="item"><span>Suất chiếu</span><strong>${escapeHtml(showtimeText)}</strong></div>
            <div class="item"><span>Ghế</span><strong>${escapeHtml(ticket.seatCode)}</strong></div>
            <div class="item"><span>Loại ghế</span><strong>${escapeHtml(ticket.seatType?.name || 'Đang cập nhật')}</strong></div>
            <div class="item"><span>Giá vé</span><strong>${escapeHtml(formatCurrency(ticket.price || 0))}</strong></div>
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

    const handleApplyPromotion = async () => {
        setApplyingPromotion(true);
        setPromotionMessage('');

        try {
            const normalizedCode = promotionCode.trim().toUpperCase();
            // Apply promotion to the first booking (simplified)
            const response = await api.patch(`/bookings/${bookings[0]._id}/promotion`, {
                promotionCode: normalizedCode
            });

            const updatedBooking = response?.data?.booking || null;
            setBookings(prev => {
                const newBookings = [...prev];
                newBookings[0] = updatedBooking;
                return newBookings;
            });
            setPromotionCode(updatedBooking?.promotionCode || '');
            setPromotionMessage(normalizedCode ? 'Áp mã khuyến mãi thành công.' : 'Đã gỡ mã khuyến mãi.');
        } catch (err) {
            setPromotionMessage(err.message || 'Không áp dụng được mã khuyến mãi.');
        } finally {
            setApplyingPromotion(false);
        }
    };

    const handlePayment = async () => {
        setProcessing(true);
        try {
            const bIds = location.state?.bookingIds || [bookingId];
            const response = await api.post('/payments/create', {
                bookingIds: bIds,
                provider: paymentProvider
            });

            const paymentUrl = response?.data?.paymentUrl;
            if (paymentUrl) {
                window.location.href = paymentUrl;
                return;
            }

            const paymentId = response?.data?.paymentId;
            if (!paymentId) {
                throw new Error('Không tạo được giao dịch thanh toán.');
            }

            await api.post(`/payments/simulate-success/${paymentId}`);
            await fetchBooking();
        } catch (err) {
            setProcessing(false);
            window.alert(err.message || 'Lỗi kết nối cổng thanh toán.');
        }
    };

    if (loading) return <div className="loader-container">Đang tải hóa đơn...</div>;
    if (error) return <div className="error-message container">{error}</div>;
    if (bookings.length === 0) return null;

    const paymentStatus = searchParams.get('payment');
    const isPaid = bookings.every(b => b.status === 'paid') || paymentStatus === 'success';
    const isCancelled = bookings.some(b => b.status === 'cancelled');

    const totalSubtotal = bookings.reduce((sum, b) => sum + (b.subtotal || 0), 0);
    const totalDiscount = bookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
    const totalAmount = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return (
        <div className={`checkout-page container animate-fade-in ${isPaid ? 'checkout-page-paid' : ''}`}>
            <div className={`checkout-wrapper glass-panel ${isPaid ? 'checkout-wrapper-paid' : ''}`}>
                <div className="checkout-header text-center mb-4">
                    {isPaid ? (
                        <CheckCircle size={50} className="text-success mb-2" style={{ margin: '0 auto' }} />
                    ) : isCancelled ? (
                        <AlertCircle size={50} className="text-danger mb-2" style={{ margin: '0 auto' }} />
                    ) : null}
                    <h2>{isPaid ? 'Thanh Toán Thành Công' : isCancelled ? 'Đơn Hàng Đã Hủy' : 'Thông Tin Thanh Toán'}</h2>
                    <p className="text-gray mt-1">Mã đơn hàng: <strong className="text-white">{bookings.length > 1 ? 'Nhiều đơn hàng' : primaryBooking.bookingCode}</strong></p>
                </div>

                <div className="checkout-details mb-4">
                    {bookings.map((b, index) => (
                        <div key={b._id} className="mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                            <div className="detail-row">
                                <span className="text-gray">Phim {index + 1}:</span>
                                <strong>{b.showtime?.movie?.title || 'Đang cập nhật'}</strong>
                            </div>
                            <div className="detail-row">
                                <span className="text-gray">Thời gian:</span>
                                <span>{b.showtime?.startTime ? new Date(b.showtime.startTime).toLocaleString('vi-VN') : 'Đang cập nhật'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="text-gray">Rạp:</span>
                                <span>{b.showtime?.cinema?.name} - {b.showtime?.room?.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="text-gray">Ghế:</span>
                                <span className="text-primary font-bold">{b.seatCodes?.join(', ')}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {!isPaid && !isCancelled && bookings.length === 1 ? (
                    <div className="promotion-box mb-4">
                        <div className="promotion-title">
                            <Tag size={18} />
                            <span>Mã khuyến mãi</span>
                        </div>
                        <div className="promotion-form">
                            <input
                                className="promotion-input"
                                value={promotionCode}
                                onChange={(event) => setPromotionCode(event.target.value.toUpperCase())}
                                placeholder="Nhập mã giảm giá"
                            />
                            <button
                                className="btn btn-outline"
                                type="button"
                                onClick={handleApplyPromotion}
                                disabled={applyingPromotion}
                            >
                                {applyingPromotion ? 'Đang áp...' : 'Áp mã'}
                            </button>
                            {primaryBooking.promotionCode ? (
                                <button
                                    className="btn btn-outline"
                                    type="button"
                                    onClick={() => {
                                        setPromotionCode('');
                                        setPromotionMessage('');
                                    }}
                                    disabled={applyingPromotion}
                                >
                                    Xóa mã
                                </button>
                            ) : null}
                        </div>
                        {promotionMessage ? <p className="promotion-message">{promotionMessage}</p> : null}
                    </div>
                ) : null}

                <div className="checkout-bill mb-4">
                    <div className="bill-row">
                        <span>Tổng tiền vé:</span>
                        <span>{totalSubtotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {totalDiscount > 0 ? (
                        <div className="bill-row discount">
                            <span>Khuyến mãi:</span>
                            <span>- {totalDiscount.toLocaleString('vi-VN')} đ</span>
                        </div>
                    ) : null}
                    <div className="divider my-2" style={{ background: 'rgba(255,255,255,0.2)' }}></div>
                    <div className="bill-row total">
                        <span>Thanh toán:</span>
                        <span className="text-primary" style={{ fontSize: '1.4rem' }}>{totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>

                {isPaid ? (
                    <div className="ticket-detail-section">
                        <div className="ticket-detail-head">
                            <div>
                                <h4>Chi tiết vé của bạn</h4>
                                <p className="text-gray">Vui lòng đưa mã QR này cho nhân viên soát vé.</p>
                            </div>
                            <span className="paid-badge">Đã thanh toán</span>
                        </div>

                        <div className="ticket-summary-box">
                            <div>
                                <span className="summary-label">Mã đơn hàng</span>
                                <strong>{bookings.length > 1 ? 'Nhiều mã' : primaryBooking.bookingCode}</strong>
                            </div>
                        </div>

                        {tickets.length > 0 ? (
                            <div className="checkout-ticket-list">
                                {tickets.map((ticket) => {
                                    const tBooking = bookings.find(b => b._id.toString() === ticket.booking.toString()) || primaryBooking;
                                    return (
                                    <div key={ticket._id} className="checkout-ticket-detail-card mb-4" style={{border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px'}}>
                                        <div className="mb-2 text-primary font-bold">
                                            {tBooking.showtime?.movie?.title} | {formatDateTime(tBooking.showtime?.startTime)}
                                        </div>
                                        <div className="ticket-info-panel">
                                            <div className="ticket-seat-code">
                                                <span>Ghế</span>
                                                <strong>{ticket.seatCode}</strong>
                                            </div>
                                            <div className="ticket-info-grid">
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
                                                    <strong>{formatCurrency(getTicketDiscountAmount(ticket, tBooking))}</strong>
                                                </div>
                                                <div>
                                                    <span>Thành tiền</span>
                                                    <strong className="ticket-final-price">{formatCurrency(getTicketFinalAmount(ticket, tBooking))}</strong>
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
                                        <div className="ticket-scan-panel">
                                            <TicketQrCode value={ticket.qrCode} title={`QR quét vé - ${tBooking.showtime?.movie?.title || 'vé'} - ghế ${ticket.seatCode}`} />
                                            <button className="btn btn-outline btn-sm save-ticket-btn" type="button" onClick={() => handleSaveTicket(ticket)}>
                                                <Download size={15} /> Lưu vé
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="ticket-empty-box">
                                Đang phát hành vé. Bấm tải lại trang nếu chi tiết vé chưa hiển thị.
                            </div>
                        )}
                    </div>
                ) : null}

                {!isPaid && !isCancelled ? (
                    <div className="payment-methods mb-4">
                        <h4 className="mb-2">Chọn phương thức thanh toán</h4>
                        <div className="methods-grid">
                            <label className={`method-card ${paymentProvider === 'vnpay' ? 'active' : ''}`}>
                                <input type="radio" name="provider" value="vnpay" checked={paymentProvider === 'vnpay'} onChange={() => setPaymentProvider('vnpay')} hidden />
                                <span>VNPay</span>
                            </label>
                            <label className={`method-card ${paymentProvider === 'momo' ? 'active' : ''}`}>
                                <input type="radio" name="provider" value="momo" checked={paymentProvider === 'momo'} onChange={() => setPaymentProvider('momo')} hidden />
                                <span>MoMo</span>
                            </label>
                        </div>
                    </div>
                ) : null}

                {!isPaid && !isCancelled && paymentQrCode ? (
                    <div className="ticket-qr-section">
                        <div className="payment-qr-head">
                            <h4>Mã QR thanh toán ngẫu nhiên</h4>
                            <button className="btn btn-outline btn-sm" type="button" onClick={refreshPaymentQr}>
                                <RefreshCw size={14} /> Đổi mã
                            </button>
                        </div>
                        <div className="checkout-ticket-grid">
                            <div className="checkout-ticket-card">
                                <div className="checkout-ticket-meta">
                                    <strong>{paymentProvider === 'vnpay' ? 'Thanh toán qua VNPay' : 'Thanh toán qua MoMo'}</strong>
                                    <span>Quét mã để mô phỏng thanh toán cho đơn {bookings.length > 1 ? 'Nhiều đơn' : primaryBooking.bookingCode}</span>
                                </div>
                                <TicketQrCode value={paymentQrCode} title={`QR ${paymentProvider.toUpperCase()}`} />
                            </div>
                        </div>
                    </div>
                ) : null}

                {!isPaid && !isCancelled ? (
                    <button className="btn btn-primary btn-block" onClick={handlePayment} disabled={processing || applyingPromotion} style={{ padding: '15px' }}>
                        {processing ? <RefreshCw className="spin" size={20} /> : 'Xác Nhận Thanh Toán'}
                    </button>
                ) : (
                    <button className="btn btn-outline btn-block" onClick={() => navigate('/profile')}>
                        Xem Vé Của Tôi
                    </button>
                )}
            </div>
        </div>
    );
};

export default Checkout;
