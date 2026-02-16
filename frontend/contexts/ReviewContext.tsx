"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  reviewsAPI,
  Review,
  ReviewCreate,
  ReviewUpdate,
  ReviewStats,
} from "@/lib/reviewApi";
import { useAuth } from "./AuthContext";

interface ReviewsContextType {
  reviews: Review[];
  currentReview: Review | null;
  loading: boolean;
  error: string | null;
  stats: ReviewStats | null;

  // Review operations
  fetchReviews: (params?: {
    product_id?: number;
    user_id?: number;
    skip?: number;
    limit?: number;
  }) => Promise<void>;

  fetchProductReviews: (
    productId: number,
    skip?: number,
    limit?: number,
  ) => Promise<void>;

  fetchUserReviews: (
    userId: number,
    skip?: number,
    limit?: number,
  ) => Promise<void>;

  fetchReview: (reviewId: number) => Promise<void>;

  createReview: (review: ReviewCreate) => Promise<Review>;

  updateReview: (reviewId: number, review: ReviewUpdate) => Promise<Review>;

  deleteReview: (reviewId: number) => Promise<void>;

  fetchStats: (productId: number) => Promise<void>;

  hasUserReviewed: (productId: number, userId: number) => Promise<boolean>;

  clearCurrentReview: () => void;
  clearError: () => void;
  setProductFilter: (productId: number | null) => void;
  setUserFilter: (userId: number | null) => void;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error("useReviews must be used within a ReviewsProvider");
  }
  return context;
};

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [productFilter, setProductFilter] = useState<number | null>(null);
  const [userFilter, setUserFilter] = useState<number | null>(null);

  const { user, token } = useAuth();

  const fetchReviews = useCallback(
    async (params?: {
      product_id?: number;
      user_id?: number;
      skip?: number;
      limit?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const data = await reviewsAPI.getAll(params);
        setReviews(data);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch reviews";
        setError(errorMsg);
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchProductReviews = useCallback(
    async (productId: number, skip?: number, limit?: number) => {
      setLoading(true);
      setError(null);
      setProductFilter(productId);

      try {
        const data = await reviewsAPI.getByProduct(productId, skip, limit);
        setReviews(data);
        const productStats = await reviewsAPI.getStats(productId);
        setStats(productStats);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch product reviews";
        setError(errorMsg);
        console.error("Error fetching product reviews:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchUserReviews = useCallback(
    async (userId: number, skip?: number, limit?: number) => {
      setLoading(true);
      setError(null);
      setUserFilter(userId);

      try {
        const data = await reviewsAPI.getByUser(userId, skip, limit);
        setReviews(data);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch user reviews";
        setError(errorMsg);
        console.error("Error fetching user reviews:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchReview = useCallback(async (reviewId: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reviewsAPI.getById(reviewId);
      setCurrentReview(data);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || err.message || "Failed to fetch review";
      setError(errorMsg);
      console.error("Error fetching review:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReview = useCallback(
    async (review: ReviewCreate): Promise<Review> => {
      setLoading(true);
      setError(null);

      try {
        if (user) {
          const hasReviewed = await reviewsAPI.hasUserReviewed(
            review.product_id,
            Number(user.id),
          );
          if (hasReviewed) {
            throw new Error("You have already reviewed this product");
          }
        }

        const newReview = await reviewsAPI.create(review);

        if (productFilter === review.product_id) {
          setReviews((prev) => [newReview, ...prev]);
        }

        if (productFilter === review.product_id) {
          const updatedStats = await reviewsAPI.getStats(review.product_id);
          setStats(updatedStats);
        }

        return newReview;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to create review";
        setError(errorMsg);
        console.error("Error creating review:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [productFilter, user],
  );

  const updateReview = useCallback(
    async (reviewId: number, review: ReviewUpdate): Promise<Review> => {
      setLoading(true);
      setError(null);

      try {
        const updatedReview = await reviewsAPI.update(reviewId, review);

        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? updatedReview : r)),
        );

        if (currentReview?.id === reviewId) {
          setCurrentReview(updatedReview);
        }

        if (productFilter && updatedReview.product_id === productFilter) {
          const updatedStats = await reviewsAPI.getStats(productFilter);
          setStats(updatedStats);
        }

        return updatedReview;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to update review";
        setError(errorMsg);
        console.error("Error updating review:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentReview, productFilter],
  );

  const deleteReview = useCallback(
    async (reviewId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      const reviewToDelete = reviews.find((r) => r.id === reviewId);

      try {
        await reviewsAPI.delete(reviewId);

        setReviews((prev) => prev.filter((r) => r.id !== reviewId));

        if (currentReview?.id === reviewId) {
          setCurrentReview(null);
        }

        if (productFilter && reviewToDelete?.product_id === productFilter) {
          const updatedStats = await reviewsAPI.getStats(productFilter);
          setStats(updatedStats);
        }
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to delete review";
        setError(errorMsg);
        console.error("Error deleting review:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reviews, currentReview, productFilter],
  );

  const fetchStats = useCallback(async (productId: number): Promise<void> => {
    try {
      const productStats = await reviewsAPI.getStats(productId);
      setStats(productStats);
    } catch (err: any) {
      console.error("Error fetching review stats:", err);
    }
  }, []);

  const hasUserReviewed = useCallback(
    async (productId: number, userId: number): Promise<boolean> => {
      try {
        return await reviewsAPI.hasUserReviewed(productId, userId);
      } catch (err) {
        console.error("Error checking user review:", err);
        return false;
      }
    },
    [],
  );

  const clearCurrentReview = useCallback(() => {
    setCurrentReview(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (token && user) {
      // Optionally load user's reviews
    }
  }, [token, user]);

  const value = {
    reviews,
    currentReview,
    loading,
    error,
    stats,

    fetchReviews,
    fetchProductReviews,
    fetchUserReviews,
    fetchReview,
    createReview,
    updateReview,
    deleteReview,
    fetchStats,
    hasUserReviewed,

    setProductFilter,
    setUserFilter,
    clearCurrentReview,
    clearError,
  };

  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
};
