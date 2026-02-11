import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
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
  (response) => {
    return response;
  },
  async (error) => { 
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
  login: async (data: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/users/log-in`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    
      if (response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getProfile: async () => {
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token');
    }
    
    try {
      const response = await api.get('/api/v1/users/profile');
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  signup: async (data: { username: string; email: string; password: string; role?: string }) => {
    console.log('📝 Signup:', { username: data.username, email: data.email });
    return api.post('/api/v1/users/sign-up', data);
  },
  
  updateProfile: async (data: any) => {
    console.log('✏️ Updating profile...');
    return api.put('/api/v1/users/profile', data);
  },
  
  deleteAccount: async (password: string) => {
    console.log('🗑️ Deleting account...');
    return api.delete('/api/v1/users/profile', { data: { password } });
  },
  
  getProtected: async () => {
    return api.get('/api/v1/users/protected');
  },
  
  getUserDashboard: async () => {
    return api.get('/api/v1/users/user/dashboard');
  },
  
  getAdminDashboard: async () => {
    return api.get('/api/v1/users/admin/dashboard');
  },
  
  getAllUsers: async () => {
    return api.get('/api/v1/users/');
  },
  
  deleteUser: async (userId: string) => {
    return api.delete(`/api/v1/users/${userId}`);
  },
};

export const authUtils = {
  setAuthData: (token: string, user: any) => {
    console.log('💾 Storing auth data...');
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('✅ Auth data stored');
  },
  
  clearAuthData: () => {
    console.log('🗑️ Clearing auth data...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    console.log('✅ Auth data cleared');
  },
  
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      return token;
    }
    return null;
  },
  
  getUser: (): any | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },
  
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },
};

export default api;