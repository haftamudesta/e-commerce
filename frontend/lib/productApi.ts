import api from '../lib/api';

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
export interface Review {
  id: number;
  text: string;
  rating: number;
  user_id: number;
  product_id: number;
  created_at: string;
  updated_at?: string;
  username?: string;
  user_avatar?: string;
}


export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  slug: string | null;
  status: "draft" |"active" |"archived";
  category_id: number | null;
  category?: {
    id: number;
    name: string;
  };
  images?: ProductImage[]; 
  primary_image?: ProductImage | null;
  reviews?: Review[];
  average_rating?: number;
  review_count?: number;
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
    `/api/v1/products/category/${categoryId}?skip=${skip}&limit=${limit}&include_images=true`
  );
  return response.data;
},

  uploadImages: async (
    productId: number, 
    files: File[], 
    options?: {
      is_primary?: boolean;
      alt_text?: string;
    }
  ): Promise<ProductImage[]> => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    if (options?.is_primary) formData.append('is_primary', 'true');
    if (options?.alt_text) formData.append('alt_text', options.alt_text);
    
    const response = await api.post(
      `/api/v1/products/${productId}/images/bulk`,  
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
   uploadImage: async (
    productId: number, 
    file: File, 
    options?: {
      is_primary?: boolean;
      display_order?: number;
      alt_text?: string;
    }
  ): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.is_primary) formData.append('is_primary', 'true');
    if (options?.display_order !== undefined) formData.append('display_order', options.display_order.toString());
    if (options?.alt_text) formData.append('alt_text', options.alt_text);
    
    const response = await api.post(
      `/api/v1/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  deleteImage: async (imageId: number): Promise<void> => {
    await api.delete(`/api/v1/product-images/${imageId}`);
  },

  updateImage: async (
    imageId: number, 
    data: {
      alt_text?: string;
      is_primary?: boolean;
      display_order?: number;
    }
  ): Promise<ProductImage> => {
    const response = await api.patch(`/api/v1/product-images/${imageId}`, data);
    return response.data;
  },
  setPrimaryImage: async (imageId: number): Promise<ProductImage> => {
    const response = await api.patch(`/api/v1/product-images/${imageId}/set-primary`);
    return response.data;
  },

  
  reorderImages: async (
    productId: number, 
    imageOrder: { id: number; display_order: number }[]
  ): Promise<ProductImage[]> => {
    const response = await api.patch(`/api/v1/products/${productId}/images/reorder`, {
      images: imageOrder
    });
    return response.data;
  },
   getProductWithImages: async (id: number): Promise<Product> => {
  const response = await api.get(`/api/v1/products/${id}?include_images=true`);
  return response.data;
},
  getProductWithReviews: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/v1/products/${id}?include_reviews=true`);
    return response.data;
  },
  getProductStats: async (id: number): Promise<{
    average_rating: number;
    review_count: number;
    rating_counts: { [key: number]: number };
  }> => {
    const response = await api.get(`/api/v1/products/${id}/stats`);
    return response.data;
  }
};