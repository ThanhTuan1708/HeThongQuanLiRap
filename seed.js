const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { User, Movie, Cinema, Room, SeatType, Showtime, Promotion } = require('./models');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QuanLiRapChieuPhim';

async function seed() {
    try {
        console.log('Connecting to', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('CONNECTED');

        console.log('Clearing User & Promotion data (giữ lại dữ liệu phim từ TMDB)...');
        await Promise.all([
            User.deleteMany({}),
            Promotion.deleteMany({})
        ]);
        console.log('✔ Cleared');

        // ============================================================
        // --- 1. Users (Tài khoản đa dạng) ---
        // ============================================================
        console.log('Creating Users...');

        const admin = new User({
            fullName: 'Admin Hệ Thống',
            email: 'admin@rapchieuphim.com',
            password: 'admin123456',
            phone: '0987654321',
            role: 'admin'
        });
        await admin.save();

        const normalUser = new User({
            fullName: 'Nguyễn Thanh Tuấn',
            email: 'user@gmail.com',
            password: 'user123456',
            phone: '0909123456',
            role: 'user'
        });
        await normalUser.save();

        const usersData = [
            { fullName: 'Trần Minh Khôi', email: 'khoi.tran@gmail.com', password: 'khoi2026!', phone: '0901234567', role: 'user' },
            { fullName: 'Lê Thị Hồng Nhung', email: 'nhung.le92@gmail.com', password: 'nhung2026!', phone: '0912345678', role: 'user' },
            { fullName: 'Phạm Đức Huy', email: 'duchuy.pham@yahoo.com', password: 'huy2026abc', phone: '0923456789', role: 'user' },
            { fullName: 'Ngô Quỳnh Anh', email: 'quynhanh.ngo@outlook.com', password: 'qanh2026x', phone: '0934567890', role: 'user' },
            { fullName: 'Hoàng Tuấn Kiệt', email: 'kiet.hoang@gmail.com', password: 'kiet2026ok', phone: '0945678901', role: 'user' },
            { fullName: 'Vũ Ngọc Bích', email: 'bich.vu@gmail.com', password: 'bich2026vn', phone: '0956789012', role: 'user' },
            { fullName: 'Đặng Thanh Sơn', email: 'son.dang@hotmail.com', password: 'son2026qq', phone: '0967890123', role: 'user' },
            { fullName: 'Bùi Phương Linh', email: 'linh.bui@gmail.com', password: 'linh2026pp', phone: '0978901234', role: 'user' },
            { fullName: 'Lý Hoàng Nam', email: 'nam.ly@gmail.com', password: 'nam2026hh', phone: '0989012345', role: 'user' },
            { fullName: 'Mai Thị Cẩm Tú', email: 'camtu.mai@gmail.com', password: 'camtu2026!', phone: '0990123456', role: 'user' },
            { fullName: 'Trịnh Công Danh', email: 'danh.trinh@gmail.com', password: 'danh2026cd', phone: '0911223344', role: 'user' },
            { fullName: 'Phan Hải Đăng', email: 'dang.phan@yahoo.com', password: 'dang2026hd', phone: '0922334455', role: 'user' }
        ];

        const users = [];
        for (const ud of usersData) {
            const u = new User(ud);
            await u.save();
            users.push(u);
        }
        console.log(`✔ ${users.length + 1} Users created`);

        // ============================================================
        // --- 2. Seat Types ---
        // ============================================================
        console.log('Creating SeatTypes...');
        const stNormal = new SeatType({ code: 'NORMAL', name: 'Ghế Thường', baseSurcharge: 0, color: '#4CAF50' });
        const stVip = new SeatType({ code: 'VIP', name: 'Ghế VIP', baseSurcharge: 30000, color: '#FF9800' });
        const stSweet = new SeatType({ code: 'SWEETBOX', name: 'Ghế Sweetbox', baseSurcharge: 60000, color: '#E91E63' });
        await Promise.all([stNormal.save(), stVip.save(), stSweet.save()]);
        console.log('✔ SeatTypes created');

        // ============================================================
        // --- 3. Cinemas ---
        // ============================================================
        console.log('Creating Cinemas...');
        const cinema1 = new Cinema({
            code: 'CINEMA_HCM_Q1',
            name: 'Rạp Quận 1',
            city: 'HCM',
            district: 'Quận 1',
            address: '72 Lê Thánh Tôn',
            phone: '028-1234-5678',
            timezone: 'Asia/Ho_Chi_Minh',
            location: { type: 'Point', coordinates: [106.7009, 10.7769] }
        });
        await cinema1.save();

        const cinema2 = new Cinema({
            code: 'CINEMA_HN_HK',
            name: 'Rạp Hoàn Kiếm',
            city: 'Hà Nội',
            district: 'Hoàn Kiếm',
            address: '55 Hai Bà Trưng',
            phone: '024-1234-5678',
            timezone: 'Asia/Ho_Chi_Minh',
            location: { type: 'Point', coordinates: [105.8542, 21.0285] }
        });
        await cinema2.save();
        console.log('✔ Cinemas created');

        // ============================================================
        // --- 4. Movies (8 phim đa dạng thể loại) ---
        // ============================================================
        console.log('Creating Movies...');
        const moviesData = [
            {
                title: 'Avengers: Endgame', slug: 'avengers-endgame',
                description: 'Trận chiến cuối cùng của các siêu anh hùng Marvel',
                genre: ['Hành động', 'Viễn tưởng'], durationMinutes: 181,
                language: 'English', subtitle: 'Vietnamese', ageRating: 'C13', status: 'now_showing'
            },
            {
                title: 'Lật Mặt 7', slug: 'lat-mat-7',
                description: 'Một bộ phim của Lý Hải về gia đình và tình cảm',
                genre: ['Hài', 'Gia đình'], durationMinutes: 130,
                language: 'Vietnamese', ageRating: 'P', status: 'now_showing'
            },
            {
                title: 'Mai', slug: 'mai-2026',
                description: 'Câu chuyện tình yêu và những nỗi đau giấu kín của một cô gái tên Mai',
                genre: ['Tâm lý', 'Tình cảm'], durationMinutes: 131,
                language: 'Vietnamese', ageRating: 'C16', status: 'now_showing'
            },
            {
                title: 'Dune: Part Two', slug: 'dune-part-two',
                description: 'Paul Atreides tiếp tục hành trình chinh phục sa mạc Arrakis',
                genre: ['Viễn tưởng', 'Phiêu lưu'], durationMinutes: 166,
                language: 'English', subtitle: 'Vietnamese', ageRating: 'C13', status: 'now_showing'
            },
            {
                title: 'Quỷ Cẩu', slug: 'quy-cau',
                description: 'Bộ phim kinh dị Việt Nam về truyền thuyết dân gian đáng sợ',
                genre: ['Kinh dị', 'Tâm lý'], durationMinutes: 105,
                language: 'Vietnamese', ageRating: 'C18', status: 'now_showing'
            },
            {
                title: 'Kungfu Panda 4', slug: 'kungfu-panda-4',
                description: 'Po tiếp tục cuộc phiêu lưu trở thành Rồng Chiến Binh',
                genre: ['Hoạt hình', 'Hài'], durationMinutes: 94,
                language: 'English', subtitle: 'Vietnamese', ageRating: 'P', status: 'now_showing'
            },
            {
                title: 'Đào, Phở và Piano', slug: 'dao-pho-va-piano',
                description: 'Bộ phim lấy bối cảnh Hà Nội năm 1946 đầy cảm xúc',
                genre: ['Lịch sử', 'Tình cảm'], durationMinutes: 100,
                language: 'Vietnamese', ageRating: 'C13', status: 'now_showing'
            },
            {
                title: 'Godzilla x Kong: The New Empire', slug: 'godzilla-x-kong',
                description: 'Godzilla và Kong hợp lực chống lại mối đe dọa mới từ lòng đất',
                genre: ['Hành động', 'Viễn tưởng'], durationMinutes: 115,
                language: 'English', subtitle: 'Vietnamese', ageRating: 'C13', status: 'now_showing'
            }
        ];

        const movies = [];
        for (const md of moviesData) {
            const m = new Movie(md);
            await m.save();
            movies.push(m);
        }
        console.log(`✔ ${movies.length} Movies created`);

        // ============================================================
        // --- 5. Rooms ---
        // ============================================================
        const generateSeatLayout = (rows, cols, normalId, vipId, sweetboxId) => {
            const seats = [];
            const rowLabels = 'ABCDEFGHIJ'.split('');
            for (let r = 0; r < rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    let stId = normalId;
                    let zone = 'standard';
                    if (r >= rows - 1) { stId = sweetboxId; zone = 'sweetbox'; }
                    else if (r >= 3 && r <= 5) { stId = vipId; zone = 'vip'; }
                    seats.push({
                        seatCode: `${rowLabels[r]}${c}`,
                        row: rowLabels[r],
                        col: c,
                        seatTypeId: stId,
                        zone,
                        isActive: true
                    });
                }
            }
            return seats;
        };

        console.log('Creating Rooms...');
        // Rạp Quận 1 - 3 phòng
        const room1 = new Room({
            cinema: cinema1._id, name: 'Phòng 1 - IMAX', screenType: 'IMAX',
            seatLayout: generateSeatLayout(10, 12, stNormal._id, stVip._id, stSweet._id)
        });
        await room1.save();

        const room2 = new Room({
            cinema: cinema1._id, name: 'Phòng 2 - 2D', screenType: '2D',
            seatLayout: generateSeatLayout(8, 10, stNormal._id, stVip._id, stSweet._id)
        });
        await room2.save();

        const room3 = new Room({
            cinema: cinema1._id, name: 'Phòng 3 - 3D', screenType: '3D',
            seatLayout: generateSeatLayout(8, 10, stNormal._id, stVip._id, stSweet._id)
        });
        await room3.save();

        // Rạp Hoàn Kiếm - 2 phòng
        const room4 = new Room({
            cinema: cinema2._id, name: 'Phòng 1 - 4DX', screenType: '4DX',
            seatLayout: generateSeatLayout(8, 10, stNormal._id, stVip._id, stSweet._id)
        });
        await room4.save();

        const room5 = new Room({
            cinema: cinema2._id, name: 'Phòng 2 - 2D', screenType: '2D',
            seatLayout: generateSeatLayout(8, 10, stNormal._id, stVip._id, stSweet._id)
        });
        await room5.save();
        console.log('✔ Rooms created');

        // ============================================================
        // --- 6. Showtimes (xuyên suốt năm 2026) ---
        // ============================================================
        console.log('Creating Showtimes for entire year 2026...');

        // Các khung giờ chiếu phổ biến
        const timeSlots = [
            { hour: 9, minute: 0 },
            { hour: 10, minute: 30 },
            { hour: 12, minute: 0 },
            { hour: 14, minute: 0 },
            { hour: 15, minute: 30 },
            { hour: 17, minute: 0 },
            { hour: 19, minute: 0 },
            { hour: 19, minute: 30 },
            { hour: 21, minute: 0 },
            { hour: 21, minute: 30 },
            { hour: 22, minute: 0 },
        ];

        // Cấu hình rạp-phòng
        const cinemaRooms = [
            { cinema: cinema1, rooms: [room1, room2, room3] },
            { cinema: cinema2, rooms: [room4, room5] }
        ];

        // Bảng giá theo loại phòng
        const pricingByScreenType = {
            'IMAX': [
                { seatTypeId: stNormal._id, price: 100000 },
                { seatTypeId: stVip._id, price: 140000 },
                { seatTypeId: stSweet._id, price: 180000 }
            ],
            '3D': [
                { seatTypeId: stNormal._id, price: 90000 },
                { seatTypeId: stVip._id, price: 125000 },
                { seatTypeId: stSweet._id, price: 165000 }
            ],
            '4DX': [
                { seatTypeId: stNormal._id, price: 110000 },
                { seatTypeId: stVip._id, price: 150000 },
                { seatTypeId: stSweet._id, price: 200000 }
            ],
            '2D': [
                { seatTypeId: stNormal._id, price: 75000 },
                { seatTypeId: stVip._id, price: 105000 },
                { seatTypeId: stSweet._id, price: 145000 }
            ]
        };

        // Phân bổ phim theo tháng (mỗi tháng chiếu 3-4 phim, xoay vòng)
        const movieScheduleByMonth = {
            1:  [0, 1, 5, 6],   // Jan: Avengers, Lật Mặt 7, Kungfu Panda 4, Đào Phở Piano
            2:  [2, 3, 5, 7],   // Feb: Mai, Dune, Kungfu Panda 4, Godzilla
            3:  [0, 2, 4, 6],   // Mar: Avengers, Mai, Quỷ Cẩu, Đào Phở Piano
            4:  [1, 3, 5, 7],   // Apr: Lật Mặt 7, Dune, Kungfu Panda 4, Godzilla
            5:  [0, 2, 6, 7],   // May: Avengers, Mai, Đào Phở Piano, Godzilla
            6:  [1, 3, 4, 5],   // Jun: Lật Mặt 7, Dune, Quỷ Cẩu, Kungfu Panda 4
            7:  [0, 1, 2, 7],   // Jul: Avengers, Lật Mặt 7, Mai, Godzilla
            8:  [3, 4, 5, 6],   // Aug: Dune, Quỷ Cẩu, Kungfu Panda 4, Đào Phở Piano
            9:  [0, 2, 3, 7],   // Sep: Avengers, Mai, Dune, Godzilla
            10: [1, 4, 5, 6],   // Oct: Lật Mặt 7, Quỷ Cẩu, Kungfu Panda 4, Đào Phở Piano
            11: [0, 1, 3, 7],   // Nov: Avengers, Lật Mặt 7, Dune, Godzilla
            12: [2, 4, 5, 6]    // Dec: Mai, Quỷ Cẩu, Kungfu Panda 4, Đào Phở Piano
        };

        const showtimeBatch = [];
        let showtimeCount = 0;

        // Tạo lịch chiếu cho từng tháng trong năm 2026
        for (let month = 1; month <= 12; month++) {
            const movieIndices = movieScheduleByMonth[month];
            const daysInMonth = new Date(2026, month, 0).getDate();

            // Mỗi tháng tạo lịch chiếu cho nhiều ngày (cách 2-3 ngày)
            for (let day = 1; day <= daysInMonth; day += 2) {
                // Xoay vòng phim & phòng cho mỗi ngày
                for (const cr of cinemaRooms) {
                    for (let ri = 0; ri < cr.rooms.length; ri++) {
                        const room = cr.rooms[ri];
                        // Mỗi phòng chiếu 2-3 suất/ngày
                        const slotsForRoom = [];
                        // Chọn 2-3 khung giờ phân bổ đều
                        const slotOffset = (day + ri) % timeSlots.length;
                        slotsForRoom.push(timeSlots[slotOffset]);
                        slotsForRoom.push(timeSlots[(slotOffset + 3) % timeSlots.length]);
                        if ((day + ri) % 3 === 0) {
                            slotsForRoom.push(timeSlots[(slotOffset + 6) % timeSlots.length]);
                        }

                        for (let si = 0; si < slotsForRoom.length; si++) {
                            const slot = slotsForRoom[si];
                            const movieIdx = movieIndices[(ri + si + day) % movieIndices.length];
                            const movie = movies[movieIdx];

                            const startTime = new Date(2026, month - 1, day, slot.hour, slot.minute, 0, 0);
                            const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60000);

                            const pricing = pricingByScreenType[room.screenType] || pricingByScreenType['2D'];

                            // Cuối tuần tăng giá 15%
                            const dayOfWeek = startTime.getDay();
                            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                            const finalPricing = isWeekend
                                ? pricing.map(p => ({ seatTypeId: p.seatTypeId, price: Math.round(p.price * 1.15 / 1000) * 1000 }))
                                : pricing;

                            showtimeBatch.push({
                                movie: movie._id,
                                cinema: cr.cinema._id,
                                room: room._id,
                                startTime,
                                endTime,
                                pricing: finalPricing,
                                status: startTime < new Date() ? 'finished' : 'open'
                            });
                            showtimeCount++;
                        }
                    }
                }
            }
        }

        // Chèn theo batch để tối ưu hiệu suất
        const batchSize = 200;
        for (let i = 0; i < showtimeBatch.length; i += batchSize) {
            const batch = showtimeBatch.slice(i, i + batchSize);
            await Showtime.insertMany(batch);
        }
        console.log(`✔ ${showtimeCount} Showtimes created (Jan-Dec 2026)`);

        // ============================================================
        // --- 7. Promotions ---
        // ============================================================
        console.log('Creating Promotions...');
        await Promotion.create([
            {
                type: 'coupon', code: 'KHAIGIANG2026',
                name: 'Giảm 20% nhân dịp khai giảng',
                discountType: 'percent', discountValue: 20,
                maxDiscount: 50000, minOrderValue: 100000,
                validFrom: new Date('2026-03-01'), validTo: new Date('2026-04-30'),
                usageLimit: 1000, perUserLimit: 1, status: 'active'
            },
            {
                type: 'coupon', code: 'GIAM30K',
                name: 'Giảm 30k cho khách mới',
                discountType: 'fixed', discountValue: 30000,
                maxDiscount: 30000, minOrderValue: 150000,
                validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-31'),
                usageLimit: 5000, perUserLimit: 1, status: 'active'
            },
            {
                type: 'coupon', code: 'TETNGUYENDAN',
                name: 'Ưu đãi Tết Nguyên Đán - Giảm 25%',
                discountType: 'percent', discountValue: 25,
                maxDiscount: 80000, minOrderValue: 100000,
                validFrom: new Date('2026-01-20'), validTo: new Date('2026-02-28'),
                usageLimit: 2000, perUserLimit: 2, status: 'active'
            },
            {
                type: 'coupon', code: 'SUMMER2026',
                name: 'Hè vui vẻ - Giảm 15% mọi suất chiếu',
                discountType: 'percent', discountValue: 15,
                maxDiscount: 40000, minOrderValue: 80000,
                validFrom: new Date('2026-06-01'), validTo: new Date('2026-08-31'),
                usageLimit: 3000, perUserLimit: 3, status: 'active'
            },
            {
                type: 'coupon', code: 'NOEL2026',
                name: 'Giáng sinh an lành - Giảm 50k',
                discountType: 'fixed', discountValue: 50000,
                maxDiscount: 50000, minOrderValue: 200000,
                validFrom: new Date('2026-12-01'), validTo: new Date('2026-12-31'),
                usageLimit: 1500, perUserLimit: 1, status: 'active'
            }
        ]);
        console.log('✔ Promotions created');

        // ============================================================
        // --- Tổng kết ---
        // ============================================================
        console.log('\n🎬 === SEED HOÀN TẤT ===');
        console.log(`📌 Admin: admin@rapchieuphim.com / admin123456`);
        console.log(`📌 Users: ${users.length} tài khoản đa dạng`);
        console.log(`🎬 Movies: ${movies.length} phim`);
        console.log(`🏢 Cinemas: 2 rạp (HCM + Hà Nội)`);
        console.log(`🚪 Rooms: 5 phòng`);
        console.log(`🎫 Showtimes: ${showtimeCount} suất chiếu xuyên suốt năm 2026`);
        console.log('\n--- Danh sách tài khoản user ---');
        usersData.forEach(u => console.log(`  ${u.fullName} | ${u.email} | ${u.password}`));

    } catch (e) {
        console.error('SEED ERROR:', e);
    } finally {
        await mongoose.connection.close();
        console.log('CLOSED');
    }
}

seed();
