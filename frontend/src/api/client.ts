import axios from 'axios';

// Use VITE_API_URL if provided (like on Vercel), otherwise fallback to Nginx proxy or localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login handled at router level
    }
    return Promise.reject(error);
  }
);

// Automatically trigger backend migration to fix 500 errors
apiClient.get('/api/migrate-repairs').catch(() => {});

// Automatically trigger machine seeding based on the excel sheet
apiClient.get('/api/seed-machines').catch(() => {});
