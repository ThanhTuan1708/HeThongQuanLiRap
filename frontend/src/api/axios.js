import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Thêm token vào request nếu có
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Xử lý chung các lỗi response
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // Nếu server trả về lỗi 401 (Hết hạn token)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Có thể redirect về login ở đây nếu cần, 
            // nhưng thường để màn hình hiện tại handle hoặc reload
            // window.location.href = '/login';
        }
        
        // Trả về error object có struct dễ dùng
        const customError = {
            message: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
            errors: error.response?.data?.errors || [],
            status: error.response?.status
        };
        return Promise.reject(customError);
    }
);

export default api;
