import React, { useEffect, useState } from 'react';
import { BadgePercent, CalendarDays, TicketPercent } from 'lucide-react';
import api from '../../api/axios';
import './Promotions.css';

const formatDiscount = (promotion) => {
    if (promotion.discountType === 'percent') {
        return `Giảm ${promotion.discountValue}%`;
    }
    return `Giảm ${promotion.discountValue.toLocaleString('vi-VN')}đ`;
};

const Promotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const response = await api.get('/promotions');
                setPromotions(response?.data?.promotions || []);
            } catch (err) {
                setError(err.message || 'Không thể tải danh sách khuyến mãi.');
            } finally {
                setLoading(false);
            }
        };

        fetchPromotions();
    }, []);

    return (
        <div className="promotions-page container animate-fade-in">
            <section className="promo-hero glass-panel">
                <div>
                    <span className="eyebrow">Khuyến Mãi</span>
                    <h1>Deal đang mở ngày hôm nay</h1>
                    <p>Sử dụng mã ưu đãi khi đặt vé online để tiết kiệm chi phí cho nhóm bạn, cặp đôi hoặc suất chiếu buổi sáng.</p>
                </div>
                <TicketPercent size={72} className="promo-icon" />
            </section>

            {loading ? <div className="loader-container">Đang tải khuyến mãi...</div> : null}
            {error ? <div className="error-message">{error}</div> : null}

            {!loading && !error ? (
                <div className="promotion-list">
                    {promotions.map((promotion) => (
                        <article className="promotion-card glass-panel" key={promotion._id}>
                            <div className="promotion-head">
                                <div>
                                    <span className="promo-code">{promotion.code}</span>
                                    <h3>{promotion.name}</h3>
                                </div>
                                <BadgePercent className="text-primary" size={28} />
                            </div>

                            <p className="promotion-desc">{promotion.description || 'Ưu đãi áp dụng cho đặt vé online trong thời gian chương trình còn hiệu lực.'}</p>

                            <div className="promotion-pill-row">
                                <span className="promotion-pill strong">{formatDiscount(promotion)}</span>
                                <span className="promotion-pill">Đơn tối thiểu {promotion.minOrderValue?.toLocaleString('vi-VN')}đ</span>
                                {promotion.maxDiscount ? <span className="promotion-pill">Tối đa {promotion.maxDiscount.toLocaleString('vi-VN')}đ</span> : null}
                            </div>

                            <div className="promotion-footer">
                                <div className="promo-validity">
                                    <CalendarDays size={16} />
                                    <span>Đến {new Date(promotion.validTo).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <span className="promotion-limit">Mỗi tài khoản: {promotion.perUserLimit} lần</span>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default Promotions;
