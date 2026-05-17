import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import Booking from './pages/Booking/Booking';
import Checkout from './pages/Checkout/Checkout';
import Cart from './pages/Cart/Cart';
import Cinemas from './pages/Cinemas/Cinemas';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import MovieDetail from './pages/MovieDetail/MovieDetail';
import Profile from './pages/Profile/Profile';
import Promotions from './pages/Promotions/Promotions';
import Register from './pages/Register/Register';
import Ticketing from './pages/Ticketing/Ticketing';
import Terms from './pages/StaticPages/Terms';
import Privacy from './pages/StaticPages/Privacy';
import FAQ from './pages/StaticPages/FAQ';
import Contact from './pages/StaticPages/Contact';

const Placeholder = ({ title }) => (
    <div className="container animate-fade-in">
        <h2>{title}</h2>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="login" element={<Login />} />
                            <Route path="register" element={<Register />} />
                            <Route path="movie/:movieId" element={<MovieDetail />} />
                            <Route path="coming-soon" element={<ComingSoon />} />
                            <Route path="cinemas" element={<Cinemas />} />
                            <Route path="promotions" element={<Promotions />} />
                            <Route path="ticketing" element={<Ticketing />} />
                            <Route path="terms" element={<Terms />} />
                            <Route path="privacy" element={<Privacy />} />
                            <Route path="faq" element={<FAQ />} />
                            <Route path="contact" element={<Contact />} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="profile" element={<Profile />} />

                                <Route element={<RoleRoute allowedRoles={['user']} redirectTo="/admin" />}>
                                    <Route path="booking/:showtimeId" element={<Booking />} />
                                    <Route path="checkout/:bookingId" element={<Checkout />} />
                                    <Route path="cart" element={<Cart />} />
                                </Route>

                                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                                    <Route path="admin" element={<AdminDashboard />} />
                                </Route>
                            </Route>

                            <Route path="home" element={<Navigate to="/" replace />} />
                            <Route path="*" element={<Placeholder title="404 - Không tìm thấy trang" />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
