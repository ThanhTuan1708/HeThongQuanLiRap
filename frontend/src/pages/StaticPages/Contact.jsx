import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import './StaticPages.css';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <div className="static-page container animate-fade-in">
            <h1>Liên Hệ Với Chúng Tôi</h1>
            <p className="page-subtitle">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>

            <div className="contact-grid">
                <div className="contact-card">
                    <div className="contact-icon">
                        <Phone size={22} />
                    </div>
                    <div className="contact-info">
                        <h3>Hotline</h3>
                        <p>1900 1234</p>
                        <p style={{ fontSize: '0.85rem' }}>Miễn phí cuộc gọi</p>
                    </div>
                </div>

                <div className="contact-card">
                    <div className="contact-icon">
                        <Mail size={22} />
                    </div>
                    <div className="contact-info">
                        <h3>Email</h3>
                        <p>hotro@cinemamax.vn</p>
                        <p style={{ fontSize: '0.85rem' }}>Phản hồi trong 24h</p>
                    </div>
                </div>

                <div className="contact-card">
                    <div className="contact-icon">
                        <MapPin size={22} />
                    </div>
                    <div className="contact-info">
                        <h3>Địa Chỉ</h3>
                        <p>72 Lê Thánh Tôn, Quận 1</p>
                        <p style={{ fontSize: '0.85rem' }}>TP. Hồ Chí Minh</p>
                    </div>
                </div>

                <div className="contact-card">
                    <div className="contact-icon">
                        <Clock size={22} />
                    </div>
                    <div className="contact-info">
                        <h3>Giờ Làm Việc</h3>
                        <p>8:00 - 22:00</p>
                        <p style={{ fontSize: '0.85rem' }}>Tất cả các ngày trong tuần</p>
                    </div>
                </div>
            </div>

            <div className="contact-form">
                <h2>Gửi Tin Nhắn Cho Chúng Tôi</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="contact-name">Họ và tên</label>
                            <input
                                id="contact-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nhập họ tên của bạn"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="contact-email">Email</label>
                            <input
                                id="contact-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                        <div className="form-group full">
                            <label htmlFor="contact-subject">Chủ đề</label>
                            <input
                                id="contact-subject"
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="VD: Hỗ trợ đặt vé, Khiếu nại, Góp ý..."
                                required
                            />
                        </div>
                        <div className="form-group full">
                            <label htmlFor="contact-message">Nội dung</label>
                            <textarea
                                id="contact-message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu của bạn..."
                                required
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ padding: '12px 28px', gap: '8px' }}>
                        <Send size={16} /> Gửi Tin Nhắn
                    </button>
                </form>
                {submitted ? (
                    <div className="contact-form-message">
                        Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Contact;
