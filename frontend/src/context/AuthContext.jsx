import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/me');
                const currentUser = response?.data?.user || null;
                setUser(currentUser);
                if (currentUser) {
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            } catch (error) {
                logout();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const hasRole = (...roles) => {
        if (!user?.role) {
            return false;
        }

        return roles.includes(user.role);
    };

    const value = {
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        hasRole,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <div className="loader-container">Đang tải cấu hình...</div>}
        </AuthContext.Provider>
    );
};
