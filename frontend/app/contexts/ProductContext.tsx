"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { productsAPI, Product, ProductsResponse } from "../lib/productApi";
import { useAuth } from "./AuthContext";

interface ProductsContextType {
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;

  fetchProducts: (params?: {
    page?: number;
    limit?: number;
    categoryId?: number;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) => Promise<void>;

  fetchProduct: (id: number) => Promise<void>;
  createProduct: (productData: any) => Promise<Product>;
  updateProduct: (id: number, productData: any) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  getProductsByCategory: (
    categoryId: number,
    page?: number,
    limit?: number,
  ) => Promise<ProductsResponse>;

  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearCurrentProduct: () => void;
  clearError: () => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(
  undefined,
);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
};

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  const { token } = useAuth();

  const fetchProducts = useCallback(
    async (params = {}) => {
      const {
        page: customPage = page,
        limit: customLimit = limit,
        categoryId,
        status,
        minPrice,
        maxPrice,
        search,
      } = params as any;

      setLoading(true);
      setError(null);
      try {
        const response = await productsAPI.getAll({
          page: customPage,
          limit: customLimit,
          categoryId,
          status,
          minPrice,
          maxPrice,
          search,
        });
        setProducts(response.products);
        setTotal(response.total);
        setPage(response.page);
        setLimit(response.limit);
      } catch (err: any) {
        setError(err.message || "Failed to fetch products");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, limit],
  );

  const fetchProduct = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const product = await productsAPI.getById(id);
      setCurrentProduct(product);
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(
    async (productData: any): Promise<Product> => {
      setLoading(true);
      setError(null);
      try {
        const newProduct = await productsAPI.create(productData);
        await fetchProducts();
        return newProduct;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to create product";
        setError(errorMsg);
        console.error("Error creating product:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchProducts],
  );

  const updateProduct = useCallback(
    async (id: number, productData: any): Promise<Product> => {
      setLoading(true);
      setError(null);
      try {
        const updatedProduct = await productsAPI.update(id, productData);
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? updatedProduct : product)),
        );
        if (currentProduct?.id === id) {
          setCurrentProduct(updatedProduct);
        }
        return updatedProduct;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to update product";
        setError(errorMsg);
        console.error("Error updating product:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentProduct],
  );

  const deleteProduct = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await productsAPI.delete(id);
        setProducts((prev) => prev.filter((product) => product.id !== id));
        if (currentProduct?.id === id) {
          setCurrentProduct(null);
        }
        setTotal((prev) => prev - 1);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to delete product";
        setError(errorMsg);
        console.error("Error deleting product:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentProduct],
  );

  const searchProducts = useCallback(
    async (query: string): Promise<Product[]> => {
      setLoading(true);
      setError(null);
      try {
        const results = await productsAPI.search(query);
        return results;
      } catch (err: any) {
        setError(err.message || "Failed to search products");
        console.error("Error searching products:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getProductsByCategory = useCallback(
    async (
      categoryId: number,
      page = 1,
      limit = 12,
    ): Promise<ProductsResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productsAPI.getByCategory(
          categoryId,
          page,
          limit,
        );
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch products by category");
        console.error("Error fetching products by category:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearCurrentProduct = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const value = {
    products,
    currentProduct,
    loading,
    error,
    total,
    page,
    limit,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCategory,
    setPage,
    setLimit,
    clearCurrentProduct,
    clearError,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};
