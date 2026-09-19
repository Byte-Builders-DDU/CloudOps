import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid and not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('cloudops_token');
        localStorage.removeItem('cloudops_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
