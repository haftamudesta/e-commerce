import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const userAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/v1/users/log-in', data),
  
  signup: (data: any) => api.post('/api/v1/users/sign-up', data),
  
  getProfile: () => api.get('/api/v1/users/profile'),
  
  updateProfile: (data: any) => api.put('/api/v1/users/profile', data),
  
  deleteAccount: (password: string) =>
    api.delete('/api/v1/users/profile', { data: { password } }),
  
  getProtected: () => api.get('/api/v1/users/protected'),
  
  getUserDashboard: () => api.get('/api/v1/users/user/dashboard'),
  
  getAdminDashboard: () => api.get('/api/v1/users/admin/dashboard'),
  
  getAllUsers: () => api.get('/api/v1/users/'),
  
  deleteUser: (userId: string) => api.delete(`/api/v1/users/${userId}`),
};

export default api;