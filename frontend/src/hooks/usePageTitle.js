import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'CinemaMAX';

const pageTitles = {
    '/': `Phim Đang Chiếu | ${SITE_NAME}`,
    '/coming-soon': `Phim Sắp Chiếu | ${SITE_NAME}`,
    '/cinemas': `Cụm Rạp | ${SITE_NAME}`,
    '/promotions': `Khuyến Mãi | ${SITE_NAME}`,
    '/login': `Đăng Nhập | ${SITE_NAME}`,
    '/register': `Đăng Ký | ${SITE_NAME}`,
    '/profile': `Tài Khoản | ${SITE_NAME}`,
    '/admin': `Quản Trị | ${SITE_NAME}`,
};

const usePageTitle = (customTitle) => {
    const location = useLocation();

    useEffect(() => {
        if (customTitle) {
            document.title = `${customTitle} | ${SITE_NAME}`;
            return;
        }

        // Kiểm tra exact match trước
        if (pageTitles[location.pathname]) {
            document.title = pageTitles[location.pathname];
            return;
        }

        // Kiểm tra dynamic routes
        if (location.pathname.startsWith('/movie/')) {
            document.title = `Chi Tiết Phim | ${SITE_NAME}`;
        } else if (location.pathname.startsWith('/booking/')) {
            document.title = `Đặt Vé | ${SITE_NAME}`;
        } else if (location.pathname.startsWith('/checkout/')) {
            document.title = `Thanh Toán | ${SITE_NAME}`;
        } else {
            document.title = SITE_NAME;
        }
    }, [location.pathname, customTitle]);
};

export default usePageTitle;
export { SITE_NAME };
