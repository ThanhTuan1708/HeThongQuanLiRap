import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../../api/axios';
import '../Login/Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (form.password !== form.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                password: form.password
            });
            setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.');
            setTimeout(() => navigate('/login'), 1000);
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container glass-panel animate-fade-in">
                <div className="login-header text-center mb-3">
                    <UserPlus className="logo-icon text-primary mb-1" size={40} />
                    <h2>Tạo Tài Khoản</h2>
                    <p className="text-gray">Đăng ký để đặt vé và quản lý lịch sử giao dịch</p>
                </div>

                {error ? <div className="login-error">{error}</div> : null}
                {success ? <div className="login-success">{success}</div> : null}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group mb-2">
                        <label>Họ và tên</label>
                        <input className="form-control" name="fullName" value={form.fullName} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-2">
                        <label>Email</label>
                        <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-2">
                        <label>Số điện thoại</label>
                        <input className="form-control" name="phone" value={form.phone} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-2">
                        <label>Mật khẩu</label>
                        <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-3">
                        <label>Xác nhận mật khẩu</label>
                        <input className="form-control" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
                    </button>
                </form>

                <div className="login-footer mt-3 text-center">
                    <p>
                        Đã có tài khoản? <Link to="/login" className="text-secondary">Đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
