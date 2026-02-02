import api from '../lib/api';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  slug: string | null;
  status: string;
  category_id: number | null;
  category?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

interface GetProductsParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export const productsAPI = {
  getAll: async (params: GetProductsParams = {}): Promise<ProductsResponse> => {
    const {
      page = 1,
      limit = 12,
      categoryId,
      status,
      minPrice,
      maxPrice,
      search
    } = params;
    
    const skip = (page - 1) * limit;
    
    let url = `/api/v1/products/?skip=${skip}&limit=${limit}`;
    
    if (categoryId) url += `&category_id=${categoryId}`;
    if (status) url += `&status=${status}`;
    if (minPrice !== undefined) url += `&min_price=${minPrice}`;
    if (maxPrice !== undefined) url += `&max_price=${maxPrice}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/v1/products/${id}`);
    return response.data;
  },

  create: async (productData: any): Promise<Product> => {
    const response = await api.post('/api/v1/products/', productData);
    return response.data;
  },

  update: async (id: number, productData: any): Promise<Product> => {
    const response = await api.put(`/api/v1/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/products/${id}`);
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await api.get(`/api/v1/products/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getByCategory: async (categoryId: number, page = 1, limit = 12): Promise<ProductsResponse> => {
    const skip = (page - 1) * limit;
    const response = await api.get(
      `/api/v1/products/category/${categoryId}?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

//   uploadImage: async (productId: number, file: File): Promise<any> => {
//     const formData = new FormData();
//     formData.append('file', file);
    
//     const response = await api.post(
//       `/api/v1/products/${productId}/image`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       }
//     );
//     return response.data;
//   },
};