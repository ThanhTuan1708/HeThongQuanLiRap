import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCart = async () => {
        if (!isAuthenticated) {
            setCartCount(0);
            setCartItems([]);
            return;
        }
        try {
            setLoading(true);
            const res = await api.get('/bookings/my?status=pending_payment');
            const items = res.data?.bookings || [];
            // Lọc ra những booking chưa hết hạn
            const validItems = items.filter(b => new Date(b.expiresAt) > new Date());
            setCartItems(validItems);
            setCartCount(validItems.length);
        } catch (error) {
            console.error('Lỗi khi tải giỏ hàng', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
        // Cập nhật giỏ hàng mỗi 30s để tự động loại bỏ các vé hết hạn 10 phút
        const interval = setInterval(fetchCart, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const addToCart = async (showtimeId, seatCodes) => {
        // Gọi api tạo booking ở component ngoài rồi gọi fetchCart để sync
        await fetchCart();
    };

    return (
        <CartContext.Provider value={{ cartCount, cartItems, loading, fetchCart, addToCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
