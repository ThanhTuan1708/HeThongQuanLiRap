import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Login.css';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const token = response?.data?.accessToken;
            const user = response?.data?.user;

            if (!token || !user) {
                throw new Error('Thông tin đăng nhập từ server không đầy đủ.');
            }

            login(user, token);

            const requestedPath = location.state?.from?.pathname;
            const fallbackPath = user.role === 'admin' ? '/admin' : '/';
            navigate(requestedPath || fallbackPath, { replace: true });
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container glass-panel animate-fade-in">
                <div className="login-header text-center mb-3">
                    <Film className="logo-icon text-primary mb-1" size={40} />
                    <h2>Đăng Nhập</h2>
                    <p className="text-gray">Chào mừng bạn quay trở lại CinemaMAX</p>
                </div>

                {error ? <div className="login-error">{error}</div> : null}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group mb-2">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                    </button>
                </form>

                <div className="login-footer mt-3 text-center">
                    <p>
                        Chưa có tài khoản? <Link to="/register" className="text-secondary">Đăng ký ngay</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
