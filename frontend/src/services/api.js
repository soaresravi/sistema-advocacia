import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({

    baseURL: API_BASE_URL,

    headers: {
        'Content-Type': 'application/json',
    },

    withCredentials: false,

});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
    
}, (error) => Promise.reject(error) );

api.interceptors.response.use((response) => response, (error) => {

    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isLoginRequest = error.config?.url?.includes('/auth/login');    
    const isTokenInvalid = error.response?.data?.message === "Token inválido" || error.response?.data?.message === "Token expirado";
        
    if ((isAuthError || isTokenInvalid) && !isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
    }
        
    return Promise.reject(error);
    
});

export default api;