import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Centralized Axios instance configured for Django REST Framework backend.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful offline handling: log error without breaking the UI
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('[API Service] Django backend not reached. Operating in Standalone / Demo mode.');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
