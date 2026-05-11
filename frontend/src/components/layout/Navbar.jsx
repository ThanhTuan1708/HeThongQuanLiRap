import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, LayoutDashboard, LogOut, Ticket, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import usePageTitle from '../../hooks/usePageTitle';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, user, logout, hasRole } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const isAdmin = hasRole('admin');
    usePageTitle();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="navbar glass-panel">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    <Film className="logo-icon text-primary" />
                    <span className="logo-text">Cinema<span className="text-primary">MAX</span></span>
                </Link>

                <nav className="nav-links">
                    <Link to="/" className="nav-link">Phim Đang Chiếu</Link>
                    <Link to="/ticketing" className="nav-link" style={{color: 'var(--color-primary)', fontWeight: 'bold'}}>Mua Vé Nhanh</Link>
                    <Link to="/coming-soon" className="nav-link">Phim Sắp Chiếu</Link>
                    <Link to="/cinemas" className="nav-link">Cụm Rạp</Link>
                    <Link to="/promotions" className="nav-link">Khuyến Mãi</Link>
                    {isAdmin ? <Link to="/admin" className="nav-link">Quản Trị</Link> : null}
                </nav>

                <div className="nav-actions">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            {!isAdmin && (
                                <Link to="/cart" className="btn-icon" title="Giỏ Hàng">
                                    <ShoppingCart size={20} />
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>
                            )}
                            {isAdmin ? (
                                <Link to="/admin" className="btn-icon" title="Bảng điều khiển quản trị">
                                    <LayoutDashboard size={20} />
                                    <span className="user-name">Admin</span>
                                </Link>
                            ) : null}
                            <Link to="/profile" className="btn-icon" title="Hồ sơ tài khoản">
                                <Ticket size={20} />
                                <span className="user-name">{user?.fullName || 'Người dùng'}</span>
                            </Link>
                            <button onClick={handleLogout} className="btn-icon btn-logout" title="Đăng xuất">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-outline">Đăng Nhập</Link>
                            <Link to="/register" className="btn btn-primary">Đăng Ký</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
