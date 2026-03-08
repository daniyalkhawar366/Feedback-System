import axios, { AxiosError } from 'axios';

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Clean up trailing slashes that cause 405/Redirection issues on POST
API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');

// Ensure protocol is present for production domains
if (API_BASE_URL.includes('.railway.app') && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't redirect if the 401 came from the login or register endpoint itself
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/login') || requestUrl.includes('/register');

      if (!isAuthRequest) {
        // Unauthorized on a protected request - clear token and redirect to home (login page)
        localStorage.removeItem('token');
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
