"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { categoriesAPI, Category } from "../lib/categoryApi";
import { useAuth } from "./AuthContext";

interface CategoriesContextType {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;

  fetchCategories: (page?: number, limit?: number) => Promise<void>;
  fetchCategory: (id: number) => Promise<void>;
  createCategory: (name: string) => Promise<Category>;
  updateCategory: (id: number, name: string) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  searchCategories: (name: string) => Promise<Category[]>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearCurrentCategory: () => void;
  clearError: () => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined,
);

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
};

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { token } = useAuth();

  const fetchCategories = useCallback(
    async (customPage?: number, customLimit?: number) => {
      const currentPage = customPage || page;
      const currentLimit = customLimit || limit;

      setLoading(true);
      setError(null);
      try {
        const response = await categoriesAPI.getAll(currentPage, currentLimit);
        setCategories(response.categories);
        setTotal(response.total);
        setPage(response.page);
        setLimit(response.limit);
      } catch (err: any) {
        setError(err.message || "Failed to fetch categories");
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, limit],
  );

  const fetchCategory = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const category = await categoriesAPI.getById(id);
      setCurrentCategory(category);
    } catch (err: any) {
      setError(err.message || "Failed to fetch category");
      console.error("Error fetching category:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(
    async (name: string): Promise<Category> => {
      setLoading(true);
      setError(null);
      try {
        const newCategory = await categoriesAPI.create({ name });
        await fetchCategories();
        return newCategory;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to create category";
        setError(errorMsg);
        console.error("Error creating category:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchCategories],
  );

  const updateCategory = useCallback(
    async (id: number, name: string): Promise<Category> => {
      setLoading(true);
      setError(null);
      try {
        const updatedCategory = await categoriesAPI.update(id, { name });
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? updatedCategory : cat)),
        );

        if (currentCategory?.id === id) {
          setCurrentCategory(updatedCategory);
        }
        return updatedCategory;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to update category";
        setError(errorMsg);
        console.error("Error updating category:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentCategory],
  );

  const deleteCategory = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await categoriesAPI.delete(id);
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        if (currentCategory?.id === id) {
          setCurrentCategory(null);
        }
        setTotal((prev) => prev - 1);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to delete category";
        setError(errorMsg);
        console.error("Error deleting category:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentCategory],
  );

  const searchCategories = useCallback(
    async (name: string): Promise<Category[]> => {
      setLoading(true);
      setError(null);
      try {
        const results = await categoriesAPI.search(name);
        return results;
      } catch (err: any) {
        setError(err.message || "Failed to search categories");
        console.error("Error searching categories:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearCurrentCategory = useCallback(() => {
    setCurrentCategory(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // You might want to update axios instance with new token here
    // This depends on how your api.ts is set up
  }, [token]);

  const value = {
    categories,
    currentCategory,
    loading,
    error,
    total,
    page,
    limit,
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    searchCategories,
    setPage,
    setLimit,
    clearCurrentCategory,
    clearError,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};
