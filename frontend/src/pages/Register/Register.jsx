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
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Xóa lỗi field khi người dùng bắt đầu nhập lại
        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!form.fullName.trim()) {
            errors.fullName = 'Họ và tên là bắt buộc.';
        } else if (form.fullName.trim().length < 2) {
            errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
        }

        if (!form.email.trim()) {
            errors.email = 'Email là bắt buộc.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errors.email = 'Email không đúng định dạng.';
        }

        if (!form.phone.trim()) {
            errors.phone = 'Số điện thoại là bắt buộc.';
        } else if (!/^(0|\+84)\d{9,10}$/.test(form.phone.trim())) {
            errors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
        }

        if (!form.password) {
            errors.password = 'Mật khẩu là bắt buộc.';
        } else if (form.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
        }

        if (!form.confirmPassword) {
            errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
        } else if (form.password !== form.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        }

        return errors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setFieldErrors({});

        // Validate phía client
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password
            });
            setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.');
            setTimeout(() => navigate('/login'), 1000);
        } catch (err) {
            // Xử lý lỗi chi tiết từ server
            if (err.errors && err.errors.length > 0) {
                const serverFieldErrors = {};
                err.errors.forEach((e) => {
                    serverFieldErrors[e.field] = e.message;
                });
                setFieldErrors(serverFieldErrors);
                setError('Vui lòng kiểm tra và sửa các thông tin bên dưới.');
            } else {
                setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getFieldClass = (fieldName) => {
        return `form-control ${fieldErrors[fieldName] ? 'form-control-error' : ''}`;
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

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group mb-2">
                        <label>Họ và tên</label>
                        <input
                            className={getFieldClass('fullName')}
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                        />
                        {fieldErrors.fullName ? <span className="field-error">{fieldErrors.fullName}</span> : null}
                    </div>
                    <div className="form-group mb-2">
                        <label>Email</label>
                        <input
                            className={getFieldClass('email')}
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                        />
                        {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
                    </div>
                    <div className="form-group mb-2">
                        <label>Số điện thoại</label>
                        <input
                            className={getFieldClass('phone')}
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="0901234567"
                        />
                        {fieldErrors.phone ? <span className="field-error">{fieldErrors.phone}</span> : null}
                    </div>
                    <div className="form-group mb-2">
                        <label>Mật khẩu</label>
                        <input
                            className={getFieldClass('password')}
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Tối thiểu 6 ký tự"
                        />
                        {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
                    </div>
                    <div className="form-group mb-3">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            className={getFieldClass('confirmPassword')}
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu"
                        />
                        {fieldErrors.confirmPassword ? <span className="field-error">{fieldErrors.confirmPassword}</span> : null}
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
