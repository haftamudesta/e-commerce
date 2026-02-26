"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Image as ImageIcon, ShoppingCart } from "lucide-react";
import { useProducts } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";

interface RelatedProductsProps {
  productId: number;
  categoryId?: number | null;
  limit?: number;
}

export default function RelatedProducts({
  productId,
  categoryId,
  limit = 4,
}: RelatedProductsProps) {
  const { getProductsByCategory } = useProducts();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user } = useAuth();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      try {
        const response = await getProductsByCategory(categoryId, 1, limit + 1);
        const filtered = response.products.filter(
          (p: any) => p.id !== productId,
        );
        setProducts(filtered.slice(0, limit));
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, productId, limit, getProductsByCategory]);

  const getFullImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    const fullUrl = `${API_BASE_URL}${cleanUrl}`;
    return fullUrl;
  };

  const handleImageError = (productId: number, imageUrl: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Related Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-12 text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No related products found
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Related Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const images = product.images || [];
          const primaryImage =
            product.primary_image ||
            images.find((img: any) => img?.is_primary) ||
            images[0];

          const hasImage = primaryImage?.image_url && !imageErrors[product.id];
          const fullImageUrl = getFullImageUrl(primaryImage?.image_url);

          const productPrice =
            typeof product.price === "string"
              ? parseFloat(product.price)
              : product.price;

          return (
            <div className="group" key={product.id}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {hasImage && fullImageUrl ? (
                    <img
                      src={fullImageUrl}
                      alt={primaryImage?.alt_text || product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(product.id, fullImageUrl)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {imageErrors[product.id]
                          ? "Failed to load"
                          : "No image"}
                      </span>
                      {fullImageUrl && (
                        <span className="text-xs text-gray-400 mt-1 px-2 text-center break-all">
                          {fullImageUrl}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transform scale-90 group-hover:scale-100 transition-transform flex items-center gap-2 hover:bg-primary-600 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Quick add to cart:", product.id);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Quick Add
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      ${productPrice.toFixed(2)}
                    </span>
                    {product.category_name && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {product.category_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sky-400">
                  <Link
                    key={product.id}
                    href={
                      user?.role == "admin"
                        ? `/dashboard/products/${product.id}`
                        : `/users/products/${product.id}`
                    }
                    className="font-bold ml-6 mb-4"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
