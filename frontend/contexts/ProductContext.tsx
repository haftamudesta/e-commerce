"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  productsAPI,
  ProductsResponse,
  Product,
  ProductImage,
} from "@/lib/productApi";
import { useAuth } from "./AuthContext";

interface ProductsContextType {
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
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

  uploadProductImage: (
    productId: number,
    file: File,
    options?: {
      is_primary?: boolean;
      display_order?: number;
      alt_text?: string;
    },
  ) => Promise<ProductImage>;

  uploadProductImages: (
    productId: number,
    files: File[],
    options?: {
      is_primary?: boolean;
      alt_text?: string;
    },
  ) => Promise<ProductImage[]>;

  deleteProductImage: (imageId: number) => Promise<void>;
  updateProductImage: (
    imageId: number,
    data: {
      alt_text?: string;
      is_primary?: boolean;
      display_order?: number;
    },
  ) => Promise<ProductImage>;

  setPrimaryImage: (imageId: number) => Promise<ProductImage>;
  reorderProductImages: (
    productId: number,
    imageOrder: { id: number; display_order: number }[],
  ) => Promise<ProductImage[]>;

  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  clearCurrentProduct: () => void;
  clearError: () => void;
  refreshCurrentProduct: () => Promise<void>;
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch products";
        setError(errorMsg);
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
      const product = await productsAPI.getProductWithImages(id);
      setCurrentProduct(product);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || err.message || "Failed to fetch product";
      setError(errorMsg);
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCurrentProduct = useCallback(async () => {
    if (currentProduct?.id) {
      await fetchProduct(currentProduct.id);
    }
  }, [currentProduct?.id, fetchProduct]);

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
          setCurrentProduct({
            ...updatedProduct,
            images: currentProduct.images || [],
          });
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
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to search products";
        setError(errorMsg);
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
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch products by category";
        setError(errorMsg);
        console.error("Error fetching products by category:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const uploadProductImage = useCallback(
    async (
      productId: number,
      file: File,
      options?: {
        is_primary?: boolean;
        display_order?: number;
        alt_text?: string;
      },
    ): Promise<ProductImage> => {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        // Simulate progress (since axios doesn't support progress by default)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        const newImage = await productsAPI.uploadImage(
          productId,
          file,
          options,
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        setProducts((prev) =>
          prev.map((product) => {
            if (product.id === productId) {
              const updatedImages = [...(product.images || []), newImage];
              return {
                ...product,
                images: updatedImages,
                primary_image: newImage.is_primary
                  ? newImage
                  : product.primary_image ||
                    updatedImages.find((img) => img.is_primary) ||
                    updatedImages[0],
              };
            }
            return product;
          }),
        );

        if (currentProduct?.id === productId) {
          setCurrentProduct((prev) => {
            const updatedImages = [...(prev?.images || []), newImage];
            return {
              ...prev!,
              images: updatedImages,
              primary_image: newImage.is_primary
                ? newImage
                : prev?.primary_image ||
                  updatedImages.find((img) => img.is_primary) ||
                  updatedImages[0],
            };
          });
        }

        return newImage;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail || err.message || "Failed to upload image";
        setError(errorMsg);
        console.error("Error uploading image:", err);
        throw err;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [currentProduct],
  );

  const uploadProductImages = useCallback(
    async (
      productId: number,
      files: File[],
      options?: {
        is_primary?: boolean;
        alt_text?: string;
      },
    ): Promise<ProductImage[]> => {
      setUploading(true);
      setError(null);

      try {
        const newImages = await productsAPI.uploadImages(
          productId,
          files,
          options,
        );

        setProducts((prev) =>
          prev.map((product) => {
            if (product.id === productId) {
              const updatedImages = [...(product.images || []), ...newImages];
              const primaryImage =
                newImages.find((img) => img.is_primary) ||
                product.primary_image ||
                updatedImages.find((img) => img.is_primary) ||
                updatedImages[0];

              return {
                ...product,
                images: updatedImages,
                primary_image: primaryImage,
              };
            }
            return product;
          }),
        );

        if (currentProduct?.id === productId) {
          setCurrentProduct((prev) => {
            const updatedImages = [...(prev?.images || []), ...newImages];
            const primaryImage =
              newImages.find((img) => img.is_primary) ||
              prev?.primary_image ||
              updatedImages.find((img) => img.is_primary) ||
              updatedImages[0];

            return {
              ...prev!,
              images: updatedImages,
              primary_image: primaryImage,
            };
          });
        }

        return newImages;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to upload images";
        setError(errorMsg);
        console.error("Error uploading images:", err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [currentProduct],
  );

  const deleteProductImage = useCallback(
    async (imageId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      const previousProducts = [...products];
      const previousCurrentProduct = currentProduct
        ? { ...currentProduct }
        : null;

      setProducts((prev) =>
        prev.map((product) => {
          if (product.images?.some((img) => img.id === imageId)) {
            const updatedImages = product.images.filter(
              (img) => img.id !== imageId,
            );
            return {
              ...product,
              images: updatedImages,
              primary_image:
                updatedImages.find((img) => img.is_primary) ||
                updatedImages[0] ||
                null,
            };
          }
          return product;
        }),
      );

      if (currentProduct?.images?.some((img) => img.id === imageId)) {
        setCurrentProduct((prev) => {
          const updatedImages = prev!.images!.filter(
            (img) => img.id !== imageId,
          );
          return {
            ...prev!,
            images: updatedImages,
            primary_image:
              updatedImages.find((img) => img.is_primary) ||
              updatedImages[0] ||
              null,
          };
        });
      }

      try {
        await productsAPI.deleteImage(imageId);
      } catch (err: any) {
        setProducts(previousProducts);
        setCurrentProduct(previousCurrentProduct);

        const errorMsg =
          err.response?.data?.detail || err.message || "Failed to delete image";
        setError(errorMsg);
        console.error("Error deleting image:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentProduct, products],
  );

  const updateProductImage = useCallback(
    async (
      imageId: number,
      data: {
        alt_text?: string;
        is_primary?: boolean;
        display_order?: number;
      },
    ): Promise<ProductImage> => {
      setLoading(true);
      setError(null);

      const previousProducts = [...products];
      const previousCurrentProduct = currentProduct
        ? { ...currentProduct }
        : null;

      setProducts((prev) =>
        prev.map((product) => {
          if (product.images?.some((img) => img.id === imageId)) {
            const updatedImages = product.images.map((img) =>
              img.id === imageId
                ? { ...img, ...data }
                : data.is_primary
                  ? { ...img, is_primary: false }
                  : img,
            );

            return {
              ...product,
              images: updatedImages,
              primary_image:
                updatedImages.find((img) => img.is_primary) ||
                updatedImages[0] ||
                null,
            };
          }
          return product;
        }),
      );

      if (currentProduct?.images?.some((img) => img.id === imageId)) {
        setCurrentProduct((prev) => {
          const updatedImages = prev!.images!.map((img) =>
            img.id === imageId
              ? { ...img, ...data }
              : data.is_primary
                ? { ...img, is_primary: false }
                : img,
          );

          return {
            ...prev!,
            images: updatedImages,
            primary_image:
              updatedImages.find((img) => img.is_primary) ||
              updatedImages[0] ||
              null,
          };
        });
      }

      try {
        const updatedImage = await productsAPI.updateImage(imageId, data);
        return updatedImage;
      } catch (err: any) {
        setProducts(previousProducts);
        setCurrentProduct(previousCurrentProduct);

        const errorMsg =
          err.response?.data?.detail || err.message || "Failed to update image";
        setError(errorMsg);
        console.error("Error updating image:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentProduct, products],
  );

  const setPrimaryImage = useCallback(
    async (imageId: number): Promise<ProductImage> => {
      return updateProductImage(imageId, { is_primary: true });
    },
    [updateProductImage],
  );

  const reorderProductImages = useCallback(
    async (
      productId: number,
      imageOrder: { id: number; display_order: number }[],
    ): Promise<ProductImage[]> => {
      setLoading(true);
      setError(null);

      const previousProducts = [...products];
      const previousCurrentProduct = currentProduct
        ? { ...currentProduct }
        : null;

      const reorderedImages = imageOrder
        .sort((a, b) => a.display_order - b.display_order)
        .map((order) => {
          const product = products.find((p) => p.id === productId);
          return product?.images?.find((img) => img.id === order.id);
        })
        .filter((img): img is ProductImage => img !== undefined);

      setProducts((prev) =>
        prev.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              images: reorderedImages,
            };
          }
          return product;
        }),
      );

      if (currentProduct?.id === productId) {
        setCurrentProduct((prev) => ({
          ...prev!,
          images: reorderedImages,
        }));
      }

      try {
        const result = await productsAPI.reorderImages(productId, imageOrder);
        return result;
      } catch (err: any) {
        setProducts(previousProducts);
        setCurrentProduct(previousCurrentProduct);

        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to reorder images";
        setError(errorMsg);
        console.error("Error reordering images:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentProduct, products],
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
  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token, fetchProducts]);

  const value = {
    products,
    currentProduct,
    loading,
    uploading,
    uploadProgress,
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

    uploadProductImage,
    uploadProductImages,
    deleteProductImage,
    updateProductImage,
    setPrimaryImage,
    reorderProductImages,

    setPage,
    setLimit,

    clearCurrentProduct,
    clearError,
    refreshCurrentProduct,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};
