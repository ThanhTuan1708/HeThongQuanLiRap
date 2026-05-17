import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import './StaticPages.css';

const faqData = [
    {
        question: 'Làm thế nào để đặt vé xem phim trên CinemaMAX?',
        answer: 'Bạn có thể đặt vé bằng cách: (1) Chọn phim muốn xem trên trang chủ hoặc trang Phim Đang Chiếu. (2) Chọn suất chiếu phù hợp. (3) Chọn ghế ngồi trên sơ đồ phòng chiếu. (4) Nhấn "Thêm vào giỏ" hoặc "Thanh toán ngay". (5) Hoàn tất thanh toán qua VNPay hoặc MoMo.'
    },
    {
        question: 'Tôi có thể hủy vé đã đặt không?',
        answer: 'Bạn có thể hủy đơn hàng khi đơn hàng đang ở trạng thái "Chờ thanh toán". Sau khi đã thanh toán thành công, vé không thể hủy trực tiếp trên hệ thống. Vui lòng liên hệ hotline 1900 1234 để được hỗ trợ trong trường hợp đặc biệt.'
    },
    {
        question: 'Ghế được giữ trong bao lâu sau khi chọn?',
        answer: 'Ghế sẽ được giữ tạm cho bạn trong vòng 10 phút kể từ khi bạn chọn. Sau 10 phút, nếu bạn chưa hoàn tất thanh toán, ghế sẽ tự động được giải phóng để người khác có thể đặt.'
    },
    {
        question: 'CinemaMAX hỗ trợ những phương thức thanh toán nào?',
        answer: 'Hiện tại, CinemaMAX hỗ trợ thanh toán qua VNPay và MoMo. Trong tương lai, chúng tôi sẽ mở rộng thêm các phương thức thanh toán khác như thẻ tín dụng quốc tế, ZaloPay, và chuyển khoản ngân hàng.'
    },
    {
        question: 'Làm thế nào để sử dụng mã khuyến mãi?',
        answer: 'Tại trang thanh toán (Checkout), bạn sẽ thấy ô "Mã khuyến mãi". Nhập mã và nhấn "Áp mã". Nếu mã hợp lệ, giá trị giảm giá sẽ được áp dụng vào đơn hàng của bạn. Mỗi mã khuyến mãi có điều kiện sử dụng riêng (giá trị đơn tối thiểu, số lần sử dụng, thời hạn...).'
    },
    {
        question: 'Tôi quên mật khẩu, phải làm sao?',
        answer: 'Hiện tại hệ thống chưa hỗ trợ tính năng quên mật khẩu tự động. Vui lòng liên hệ hotline 1900 1234 hoặc gửi email đến hotro@cinemamax.vn kèm theo thông tin tài khoản để được hỗ trợ đặt lại mật khẩu.'
    },
    {
        question: 'Vé điện tử hoạt động như thế nào?',
        answer: 'Sau khi thanh toán thành công, hệ thống sẽ tự động phát hành vé điện tử với mã QR duy nhất cho mỗi ghế. Bạn có thể xem vé trong mục "Tài khoản" > "Lịch sử đặt vé", hoặc tải vé về dưới dạng file HTML. Khi đến rạp, chỉ cần đưa mã QR cho nhân viên soát vé.'
    },
    {
        question: 'Giá vé cuối tuần có khác ngày thường không?',
        answer: 'Có. Giá vé vào ngày cuối tuần (Thứ 7 và Chủ Nhật) sẽ cao hơn khoảng 15% so với ngày thường. Giá vé cụ thể được hiển thị rõ ràng khi bạn chọn suất chiếu và ghế ngồi.'
    },
    {
        question: 'Các loại ghế có gì khác nhau?',
        answer: 'CinemaMAX có 3 loại ghế: (1) Ghế Thường - giá tiết kiệm, phù hợp với mọi đối tượng. (2) Ghế VIP - vị trí trung tâm, tầm nhìn tốt nhất. (3) Ghế Sweetbox - ghế đôi dành cho các cặp đôi, nằm ở hàng cuối.'
    },
    {
        question: 'Tôi có thể đặt vé cho nhiều suất chiếu cùng lúc không?',
        answer: 'Có! CinemaMAX hỗ trợ tính năng "Giỏ vé". Bạn có thể thêm nhiều booking vào giỏ hàng và thanh toán tất cả cùng một lúc, rất tiện lợi khi đặt vé cho nhiều bộ phim hoặc nhiều suất chiếu khác nhau.'
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="static-page container animate-fade-in">
            <h1>Câu Hỏi Thường Gặp</h1>
            <p className="page-subtitle">Tìm câu trả lời cho những thắc mắc phổ biến nhất về dịch vụ CinemaMAX</p>

            <div className="faq-list">
                {faqData.map((item, index) => (
                    <div key={index} className="faq-item">
                        <button
                            className={`faq-question ${openIndex === index ? 'active' : ''}`}
                            onClick={() => toggleFaq(index)}
                        >
                            <span><HelpCircle size={18} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle', color: 'var(--color-primary)' }} />{item.question}</span>
                            <ChevronDown size={18} />
                        </button>
                        <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                            <p>{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
