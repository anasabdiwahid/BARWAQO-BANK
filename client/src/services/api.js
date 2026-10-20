import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('barwaqo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRequest = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/me');
      if (!isAuthRequest) {
        localStorage.removeItem('barwaqo_token');
        localStorage.removeItem('barwaqo_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

