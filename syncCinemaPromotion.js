const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { Cinema, Promotion } = require('./models');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';

const cinemas = [
    {
        code: 'CINEMA_HCM_Q1',
        name: 'CinemaMax Quận 1',
        city: 'HCM',
        district: 'Quận 1',
        address: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
        phone: '028-1234-5678',
        email: 'q1@cinemamax.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Cụm rạp trung tâm với phòng IMAX, khu chờ sang trọng và vị trí di chuyển thuận tiện.',
        location: { type: 'Point', coordinates: [106.7009, 10.7769] },
        status: 'active'
    },
    {
        code: 'CINEMA_HCM_TD',
        name: 'CinemaMax Thủ Đức',
        city: 'HCM',
        district: 'Thủ Đức',
        address: '216 Võ Văn Ngân, Thủ Đức, TP.HCM',
        phone: '028-2233-5566',
        email: 'thuduc@cinemamax.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Không gian trẻ trung gần làng đại học, phù hợp xem phim cuối tuần và nhóm bạn.',
        location: { type: 'Point', coordinates: [106.7555, 10.8506] },
        status: 'active'
    },
    {
        code: 'CINEMA_HN_HK',
        name: 'CinemaMax Hoàn Kiếm',
        city: 'Hà Nội',
        district: 'Hoàn Kiếm',
        address: '55 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
        phone: '024-1234-5678',
        email: 'hoankiem@cinemamax.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Cụm rạp phong cách cổ điển ngay trung tâm Hà Nội, có phòng chiếu cao cấp và cafe mini.',
        location: { type: 'Point', coordinates: [105.8542, 21.0285] },
        status: 'active'
    }
];

const promotions = [
    {
        type: 'coupon',
        code: 'MOVIELOVER20',
        name: 'Giảm 20% cho fan điện ảnh',
        description: 'Áp dụng cho tất cả suất chiếu trong tuần, tối đa 50.000đ mỗi đơn.',
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 50000,
        minOrderValue: 120000,
        validFrom: new Date('2026-03-01'),
        validTo: new Date('2026-12-31'),
        usageLimit: 5000,
        perUserLimit: 2,
        status: 'active'
    },
    {
        type: 'coupon',
        code: 'COMBO30K',
        name: 'Giảm 30.000đ cho đơn từ 2 vé',
        description: 'Dành cho đơn hàng từ 2 vé trở lên, rất hợp cho cặp đôi và nhóm bạn.',
        discountType: 'fixed',
        discountValue: 30000,
        maxDiscount: 30000,
        minOrderValue: 180000,
        validFrom: new Date('2026-03-01'),
        validTo: new Date('2026-09-30'),
        usageLimit: 3000,
        perUserLimit: 1,
        status: 'active'
    },
    {
        type: 'coupon',
        code: 'STUDENT25',
        name: 'Ưu đãi sinh viên 25%',
        description: 'Áp dụng các suất trước 17:00 thứ Hai đến thứ Sáu khi check-in bằng email sinh viên.',
        discountType: 'percent',
        discountValue: 25,
        maxDiscount: 45000,
        minOrderValue: 90000,
        validFrom: new Date('2026-03-15'),
        validTo: new Date('2026-08-31'),
        usageLimit: 2000,
        perUserLimit: 3,
        status: 'active'
    }
];

async function syncCinemaPromotion() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        for (const cinema of cinemas) {
            await Cinema.findOneAndUpdate(
                { code: cinema.code },
                cinema,
                { upsert: true, setDefaultsOnInsert: true, runValidators: true }
            );
            console.log(`Synced cinema: ${cinema.name}`);
        }

        for (const promotion of promotions) {
            await Promotion.findOneAndUpdate(
                { code: promotion.code },
                promotion,
                { upsert: true, setDefaultsOnInsert: true, runValidators: true }
            );
            console.log(`Synced promotion: ${promotion.code}`);
        }

        console.log('Cinema and promotion sync completed.');
    } catch (error) {
        console.error('Cinema/promotion sync failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

syncCinemaPromotion();
