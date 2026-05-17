import React from 'react';
import { FileText, Shield, CreditCard, UserCheck, AlertTriangle, Scale } from 'lucide-react';
import './StaticPages.css';

const Terms = () => {
    return (
        <div className="static-page container animate-fade-in">
            <h1>Điều Khoản Sử Dụng</h1>
            <p className="page-subtitle">Cập nhật lần cuối: 01/01/2026</p>

            <div className="static-section">
                <h2><FileText size={20} /> Giới Thiệu</h2>
                <p>
                    Chào mừng bạn đến với CinemaMAX. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ
                    các điều khoản và điều kiện được nêu dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
                </p>
            </div>

            <div className="static-section">
                <h2><UserCheck size={20} /> Tài Khoản Người Dùng</h2>
                <ul>
                    <li>Bạn phải cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản.</li>
                    <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
                    <li>Mỗi người chỉ được sở hữu một tài khoản trên hệ thống.</li>
                    <li>CinemaMAX có quyền khóa hoặc xóa tài khoản vi phạm điều khoản sử dụng.</li>
                </ul>
            </div>

            <div className="static-section">
                <h2><CreditCard size={20} /> Đặt Vé & Thanh Toán</h2>
                <ul>
                    <li>Vé đã thanh toán thành công sẽ không được hoàn lại trừ trường hợp đặc biệt.</li>
                    <li>Ghế được giữ tạm trong 10 phút kể từ khi chọn. Quá thời gian này, ghế sẽ được giải phóng.</li>
                    <li>Giá vé có thể thay đổi vào ngày cuối tuần và ngày lễ.</li>
                    <li>Mã khuyến mãi chỉ được sử dụng một lần cho mỗi đơn hàng (trừ khi có quy định khác).</li>
                    <li>CinemaMAX không chịu trách nhiệm về lỗi giao dịch từ phía cổng thanh toán bên thứ ba.</li>
                </ul>
            </div>

            <div className="static-section">
                <h2><AlertTriangle size={20} /> Hành Vi Bị Cấm</h2>
                <ul>
                    <li>Sử dụng hệ thống cho mục đích bất hợp pháp hoặc gian lận.</li>
                    <li>Tạo nhiều tài khoản để lợi dụng chương trình khuyến mãi.</li>
                    <li>Quay phim, chụp ảnh màn hình chiếu phim trong rạp.</li>
                    <li>Can thiệp, phá hoại hệ thống hoặc dữ liệu của CinemaMAX.</li>
                </ul>
            </div>

            <div className="static-section">
                <h2><Scale size={20} /> Giới Hạn Trách Nhiệm</h2>
                <p>
                    CinemaMAX cung cấp dịch vụ trên cơ sở "nguyên trạng". Chúng tôi không đảm bảo hệ thống hoạt động
                    liên tục và không bị gián đoạn. CinemaMAX có quyền thay đổi, tạm ngưng hoặc chấm dứt dịch vụ mà
                    không cần thông báo trước. Trong mọi trường hợp, trách nhiệm bồi thường của CinemaMAX không vượt
                    quá số tiền bạn đã thanh toán cho giao dịch liên quan.
                </p>
            </div>

            <div className="static-section">
                <h2><Shield size={20} /> Thay Đổi Điều Khoản</h2>
                <p>
                    CinemaMAX có quyền cập nhật điều khoản sử dụng bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay
                    khi được đăng tải trên trang web. Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật
                    đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
                </p>
            </div>
        </div>
    );
};

export default Terms;
