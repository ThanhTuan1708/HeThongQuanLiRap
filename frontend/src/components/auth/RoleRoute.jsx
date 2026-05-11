import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleRoute = ({ allowedRoles = [], redirectTo = '/profile' }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loader-container">Đang kiểm tra quyền truy cập...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default RoleRoute;
