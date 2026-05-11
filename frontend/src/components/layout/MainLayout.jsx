import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Main Layout chứa Navbar ở trên và Footer ở dưới.
 * Nội dung các trang sẽ được render trong thẻ <main> ở giữa (thông qua <Outlet/>)
 */
const MainLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="main-content" style={{ flex: 1, padding: '40px 0' }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
