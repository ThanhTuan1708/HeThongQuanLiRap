import React from 'react';
import { Shield, Eye, Database, Lock, Bell, UserX } from 'lucide-react';
import './StaticPages.css';

const Privacy = () => {
    return (
        <div className="static-page container animate-fade-in">
            <h1>Chính Sách Bảo Mật</h1>
            <p className="page-subtitle">Cập nhật lần cuối: 01/01/2026</p>

            <div className="static-section">
                <h2><Shield size={20} /> Cam Kết Bảo Mật</h2>
                <p>
                    CinemaMAX cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. Chính sách bảo mật này
                    giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn khi sử dụng dịch vụ
                    đặt vé xem phim trực tuyến.
                </p>
            </div>

            <div className="static-section">
                <h2><Database size={20} /> Thông Tin Thu Thập</h2>
                <p>Chúng tôi thu thập các loại thông tin sau:</p>
                <ul>
                    <li>Họ tên, email, số điện thoại khi bạn đăng ký tài khoản.</li>
                    <li>Lịch sử đặt vé, giao dịch thanh toán và thông tin ghế đã chọn.</li>
                    <li>Thông tin thiết bị, trình duyệt và địa chỉ IP khi truy cập hệ thống.</li>
                    <li>Sở thích xem phim để cá nhân hóa trải nghiệm và đề xuất phim phù hợp.</li>
                </ul>
            </div>

            <div className="static-section">
                <h2><Eye size={20} /> Mục Đích Sử Dụng</h2>
                <ul>
                    <li>Xử lý đơn đặt vé, thanh toán và phát hành vé điện tử.</li>
                    <li>Gửi xác nhận đơn hàng, thông báo suất chiếu và mã khuyến mãi.</li>
                    <li>Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.</li>
                    <li>Ngăn chặn gian lận và đảm bảo an ninh hệ thống.</li>
                    <li>Tuân thủ các nghĩa vụ pháp lý theo quy định của pháp luật Việt Nam.</li>
                </ul>
            </div>

            <div className="static-section">
                <h2><Lock size={20} /> Bảo Mật Dữ Liệu</h2>
                <p>
                    Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành bao gồm mã hóa dữ liệu (JWT),
                    bảo vệ mật khẩu bằng thuật toán bcrypt, và giới hạn quyền truy cập dữ liệu cho nhân viên
                    được ủy quyền. Thông tin thanh toán được xử lý thông qua các cổng thanh toán bên thứ ba
                    đáng tin cậy (VNPay, MoMo) và CinemaMAX không lưu trữ thông tin thẻ của bạn.
                </p>
            </div>

            <div className="static-section">
                <h2><Bell size={20} /> Chia Sẻ Thông Tin</h2>
                <p>
                    CinemaMAX không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba.
                    Chúng tôi chỉ chia sẻ thông tin trong các trường hợp sau:
                </p>
                <ul>
                    <li>Với đối tác cổng thanh toán để xử lý giao dịch.</li>
                    <li>Khi được yêu cầu bởi cơ quan pháp luật có thẩm quyền.</li>
                    <li>Khi cần thiết để bảo vệ quyền lợi hợp pháp của CinemaMAX.</li>
                </ul>
            </div>

            <div className="static-section">
                <h2><UserX size={20} /> Quyền Của Bạn</h2>
                <ul>
                    <li>Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân của bạn.</li>
                    <li>Từ chối nhận email marketing và thông báo khuyến mãi.</li>
                    <li>Yêu cầu xóa tài khoản vĩnh viễn bằng cách liên hệ bộ phận hỗ trợ.</li>
                    <li>Khiếu nại về việc xử lý dữ liệu cá nhân không đúng quy định.</li>
                </ul>
            </div>
        </div>
    );
};

export default Privacy;
