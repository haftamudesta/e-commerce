import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/api/v1/users/sign-up', userData);
    return response.data;
  },

   login: async (credentials: {
    username: string;
    password: string;
  }) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/api/v1/users/log-in', formData);
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
  },

  getProfile: async () => {
    const response = await api.get('/api/v1/users/profile');
    return response.data;
  },

  getProtectedData: async () => {
    const response = await api.get('/api/v1/users/protected');
    return response.data;
  },
};

export default api;
