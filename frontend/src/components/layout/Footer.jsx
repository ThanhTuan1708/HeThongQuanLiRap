import React from 'react';
import { Film, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer shadow-glow">
            <div className="container footer-content">
                <div className="footer-brand">
                    <div className="nav-logo mb-2">
                        <Film className="logo-icon text-primary" />
                        <span className="logo-text">Cinema<span className="text-primary">MAX</span></span>
                    </div>
                    <p className="footer-desc">Trải nghiệm điện ảnh đỉnh cao với hệ thống rạp đạt chuẩn quốc tế.</p>
                    <div className="footer-socials">
                        <Facebook size={20} className="social-icon" />
                        <Instagram size={20} className="social-icon" />
                        <Twitter size={20} className="social-icon" />
                        <Youtube size={20} className="social-icon" />
                    </div>
                </div>

                <div className="footer-links-group">
                    <h3 className="footer-title">Khám Phá</h3>
                    <ul className="footer-links">
                        <li><a href="#">Phim Đang Chiếu</a></li>
                        <li><a href="#">Phim Sắp Chiếu</a></li>
                        <li><a href="#">Cụm Rạp</a></li>
                        <li><a href="#">Khuyến Mãi</a></li>
                    </ul>
                </div>

                <div className="footer-links-group">
                    <h3 className="footer-title">Hỗ Trợ</h3>
                    <ul className="footer-links">
                        <li><a href="#">Điều khoản sử dụng</a></li>
                        <li><a href="#">Chính sách bảo mật</a></li>
                        <li><a href="#">Câu hỏi thường gặp</a></li>
                        <li><a href="#">Liên hệ</a></li>
                    </ul>
                </div>

                <div className="footer-links-group">
                    <h3 className="footer-title">Liên Hệ</h3>
                    <ul className="footer-links">
                        <li>Hotline: 1900 1234</li>
                        <li>Email: hotro@cinemamax.vn</li>
                        <li>Địa chỉ: 72 Lê Thánh Tôn, Quận 1, Tp.HCM</li>
                    </ul>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; 2026 CinemaMAX. All Rights Reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
