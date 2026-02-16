import api from "./api";

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

export interface ReviewCreate {
  text: string;
  rating: number;
  product_id: number;
}

export interface ReviewUpdate {
  text?: string;
  rating?: number;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_counts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const reviewsAPI = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    product_id?: number;
    user_id?: number;
  }): Promise<Review[]> => {
    let url = "/api/v1/reviews/";
    const queryParams = new URLSearchParams();

    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.product_id)
      queryParams.append("product_id", params.product_id.toString());
    if (params?.user_id)
      queryParams.append("user_id", params.user_id.toString());

    if (queryParams.toString()) {
      url += "?" + queryParams.toString();
    }

    const response = await api.get(url);
    return response.data;
  },

  getByProduct: async (
    productId: number,
    skip?: number,
    limit?: number,
  ): Promise<Review[]> => {
    let url = `/api/v1/reviews/product/${productId}`;
    const queryParams = new URLSearchParams();

    if (skip) queryParams.append("skip", skip.toString());
    if (limit) queryParams.append("limit", limit.toString());

    if (queryParams.toString()) {
      url += "?" + queryParams.toString();
    }

    const response = await api.get(url);
    return response.data;
  },

  getByUser: async (
    userId: number,
    skip?: number,
    limit?: number,
  ): Promise<Review[]> => {
    let url = `/api/v1/reviews/user/${userId}`;
    const queryParams = new URLSearchParams();

    if (skip) queryParams.append("skip", skip.toString());
    if (limit) queryParams.append("limit", limit.toString());

    if (queryParams.toString()) {
      url += "?" + queryParams.toString();
    }

    const response = await api.get(url);
    return response.data;
  },

  getById: async (reviewId: number): Promise<Review> => {
    const response = await api.get(`/api/v1/reviews/${reviewId}`);
    return response.data;
  },

  create: async (review: ReviewCreate): Promise<Review> => {
    const response = await api.post("/api/v1/reviews/", review);
    return response.data;
  },

  update: async (reviewId: number, review: ReviewUpdate): Promise<Review> => {
    const response = await api.put(`/api/v1/reviews/${reviewId}`, review);
    return response.data;
  },

  delete: async (reviewId: number): Promise<void> => {
    await api.delete(`/api/v1/reviews/${reviewId}`);
  },

  getStats: async (productId: number): Promise<ReviewStats> => {
    const reviews = await reviewsAPI.getByProduct(productId);

    const total = reviews.length;
    if (total === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((review) => {
      counts[review.rating as keyof typeof counts]++;
    });

    return {
      average_rating: Number((sum / total).toFixed(1)),
      total_reviews: total,
      rating_counts: counts,
    };
  },

  hasUserReviewed: async (
    productId: number,
    userId: number,
  ): Promise<boolean> => {
    const reviews = await reviewsAPI.getByProduct(productId);
    return reviews.some((review) => review.user_id === userId);
  },
};
