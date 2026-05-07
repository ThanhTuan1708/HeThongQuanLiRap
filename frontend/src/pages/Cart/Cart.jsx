import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Clock, CreditCard } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';
import './Cart.css';

const Cart = () => {
    usePageTitle('Giỏ Hàng');
    const navigate = useNavigate();
    const { cartItems, fetchCart, loading } = useCart();
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Fetch fresh cart on mount
        fetchCart();
    }, []);

    const handleRemove = async (bookingId) => {
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            await fetchCart();
        } catch (error) {
            console.error('Lỗi khi xóa vé:', error);
            alert('Không thể xóa vé lúc này.');
        }
    };

    const handleCheckoutAll = async () => {
        if (cartItems.length === 0) return;
        setProcessing(true);
        try {
            // Chúng ta có thể pass nhiều bookingIds qua query string hoặc chuyển sang 1 trang checkout chung
            // Nhưng hiện tại trang Checkout chỉ nhận 1 bookingId trên URL: /checkout/:bookingId
            // Do đó chúng ta sẽ dùng bookingId đầu tiên làm mỏ neo, và truyền mảng bookingIds qua state
            const primaryBooking = cartItems[0];
            const bookingIds = cartItems.map(b => b._id);
            navigate(`/checkout/${primaryBooking._id}`, { state: { bookingIds } });
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
        } finally {
            setProcessing(false);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + item.totalAmount, 0);
    };

    const getRemainingTime = (expiresAt) => {
        const remaining = new Date(expiresAt) - new Date();
        if (remaining <= 0) return 'Đã hết hạn';
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading && cartItems.length === 0) {
        return <div className="container py-5 text-center">Đang tải giỏ hàng...</div>;
    }

    return (
        <div className="cart-page container animate-fade-in py-4">
            <h1 className="page-title mb-4 flex items-center gap-2">
                <ShoppingCart size={28} /> Giỏ Hàng Của Bạn
            </h1>

            {cartItems.length === 0 ? (
                <div className="empty-cart glass-panel text-center p-5">
                    <ShoppingCart size={48} className="mx-auto mb-3 text-gray" />
                    <h3 className="mb-2">Giỏ hàng trống</h3>
                    <p className="text-gray mb-4">Bạn chưa chọn vé nào hoặc vé đã hết hạn giữ chỗ (10 phút).</p>
                    <button className="btn btn-primary" onClick={() => navigate('/ticketing')}>
                        Mua Vé Ngay
                    </button>
                </div>
            ) : (
                <div className="cart-content">
                    <div className="cart-items">
                        <div className="alert alert-warning mb-3">
                            <strong>Lưu ý:</strong> Ghế của bạn chỉ được giữ trong 10 phút. Nếu quá hạn, vé sẽ tự động bị hủy khỏi giỏ hàng.
                        </div>
                        {cartItems.map((item) => (
                            <div key={item._id} className="cart-item glass-panel mb-3">
                                <div className="cart-item-header flex justify-between">
                                    <h4>{item.showtime?.movie?.title || 'Phim đã chọn'}</h4>
                                    <button 
                                        className="btn-icon text-danger"
                                        onClick={() => handleRemove(item._id)}
                                        title="Xóa vé này"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="cart-item-details">
                                    <p><strong>Rạp:</strong> {item.showtime?.cinema?.name} - {item.showtime?.room?.name}</p>
                                    <p>
                                        <strong>Suất chiếu:</strong> {new Date(item.showtime?.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.showtime?.startTime).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p><strong>Ghế:</strong> {item.seatCodes.join(', ')}</p>
                                    <p className="text-warning flex items-center gap-1 mt-2">
                                        <Clock size={16} /> 
                                        Hết hạn sau: <strong>{getRemainingTime(item.expiresAt)}</strong>
                                    </p>
                                </div>
                                <div className="cart-item-price text-right mt-2">
                                    <strong>{item.totalAmount.toLocaleString('vi-VN')} đ</strong>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary glass-panel sticky-sidebar">
                        <h3 className="mb-3">Tổng cộng</h3>
                        <div className="flex justify-between mb-2">
                            <span>Số lượng vé:</span>
                            <span>{cartItems.reduce((acc, item) => acc + item.seatCodes.length, 0)} vé</span>
                        </div>
                        <div className="divider my-2"></div>
                        <div className="flex justify-between mb-4">
                            <strong>Thành tiền:</strong>
                            <strong className="text-primary text-xl">{calculateTotal().toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <button 
                            className="btn btn-primary btn-block flex items-center justify-center gap-2"
                            onClick={handleCheckoutAll}
                            disabled={processing}
                        >
                            <CreditCard size={20} />
                            {processing ? 'Đang xử lý...' : 'Thanh Toán Tất Cả'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
