import api from "./api";

export interface Category {
  id: number;
  name: string;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
}

export const categoriesAPI = {
  getAll: async (page = 1, limit = 10): Promise<CategoriesResponse> => {
    const skip = (page - 1) * limit;
    const response = await api.get(`/api/v1/categories/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await api.get(`/api/v1/categories/${id}`);
    return response.data;
  },

  create: async (category: { name: string }): Promise<Category> => {
    const response = await api.post('/api/v1/categories/', category);
    return response.data;
  },

  update: async (id: number, category: { name: string }): Promise<Category> => {
    const response = await api.put(`/api/v1/categories/${id}`, category);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/categories/${id}`);
  },

  search: async (name: string): Promise<Category[]> => {
    const response = await api.get(`/api/v1/categories/search/?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  getCount: async (): Promise<{ total: number }> => {
    const response = await api.get('/api/v1/categories/count/');
    return response.data;
  },
};