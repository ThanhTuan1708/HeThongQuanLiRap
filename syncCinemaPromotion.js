const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { Cinema, Promotion } = require('./models');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';

const cinemas = [
    {
        code: 'CINEMA_HCM_Q1',
        name: 'CinemaMax Quan 1',
        city: 'HCM',
        district: 'Quan 1',
        address: '72 Le Thanh Ton, Quan 1, TP.HCM',
        phone: '028-1234-5678',
        email: 'q1@cinemamax.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Cum rap trung tam voi phong IMAX, khu cho sang trong va vi tri di chuyen thuan tien.',
        location: { type: 'Point', coordinates: [106.7009, 10.7769] },
        status: 'active'
    },
    {
        code: 'CINEMA_HCM_TD',
        name: 'CinemaMax Thu Duc',
        city: 'HCM',
        district: 'Thu Duc',
        address: '216 Vo Van Ngan, Thu Duc, TP.HCM',
        phone: '028-2233-5566',
        email: 'thuduc@cinemamax.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Khong gian tre trung gan lang dai hoc, phu hop xem phim cuoi tuan va nhom ban.',
        location: { type: 'Point', coordinates: [106.7555, 10.8506] },
        status: 'active'
    },
    {
        code: 'CINEMA_HN_HK',
        name: 'CinemaMax Hoan Kiem',
        city: 'Ha Noi',
        district: 'Hoan Kiem',
        address: '55 Hai Ba Trung, Hoan Kiem, Ha Noi',
        phone: '024-1234-5678',
        email: 'hoankiem@cinemamax.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Cum rap phong cach co dien ngay trung tam Ha Noi, co phong chieu cao cap va cafe mini.',
        location: { type: 'Point', coordinates: [105.8542, 21.0285] },
        status: 'active'
    }
];

const promotions = [
    {
        type: 'coupon',
        code: 'MOVIELOVER20',
        name: 'Giam 20% cho fan dien anh',
        description: 'Ap dung cho tat ca suat chieu trong tuan, toi da 50.000d moi don.',
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
        name: 'Giam 30.000d cho don tu 2 ve',
        description: 'Danh cho don hang tu 2 ve tro len, rat hop cho cap doi va nhom ban.',
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
        name: 'Uu dai sinh vien 25%',
        description: 'Ap dung cac suat truoc 17:00 thu Hai den thu Sau khi check-in bang email sinh vien.',
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
