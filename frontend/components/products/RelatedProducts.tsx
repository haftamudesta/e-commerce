"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Image as ImageIcon, ShoppingCart } from "lucide-react";
import { useProducts } from "@/contexts/ProductContext";

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

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      console.log("🔍 RelatedProducts mounted with:", {
        productId,
        categoryId,
        limit,
      });

      if (!categoryId) {
        console.log("❌ No categoryId provided");
        setLoading(false);
        return;
      }

      try {
        console.log(`📡 Fetching products for category: ${categoryId}`);
        const response = await getProductsByCategory(categoryId, 1, limit + 1);
        console.log("📦 Raw API response:", response);

        // Filter out the current product
        const filtered = response.products.filter(
          (p: any) => p.id !== productId,
        );
        console.log("🔍 Filtered products (excluding current):", filtered);

        setProducts(filtered.slice(0, limit));

        // Log each product's image data
        filtered.slice(0, limit).forEach((p: any, index: number) => {
          console.log(`📸 Product ${index + 1} (ID: ${p.id}):`, {
            name: p.name,
            hasImages: !!p.images,
            imagesLength: p.images?.length,
            hasPrimaryImage: !!p.primary_image,
            primaryImage: p.primary_image,
            firstImage: p.images?.[0],
            fullProduct: p,
          });
        });
      } catch (error) {
        console.error("❌ Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, productId, limit, getProductsByCategory]);

  const getFullImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) {
      console.log("⚠️ getFullImageUrl: No image URL provided");
      return null;
    }

    console.log("🖼️ getFullImageUrl - Original URL:", imageUrl);

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      console.log("✅ Using full URL:", imageUrl);
      return imageUrl;
    }

    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    const fullUrl = `${API_BASE_URL}${cleanUrl}`;
    console.log("🔧 Constructed URL:", fullUrl);
    return fullUrl;
  };

  const handleImageError = (productId: number, imageUrl: string) => {
    console.log(`❌ Image failed to load for product ${productId}:`, imageUrl);
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const handleImageLoad = (productId: number) => {
    console.log(`✅ Image loaded successfully for product ${productId}`);
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
    console.log("ℹ️ No related products to display");
    return (
      <div className="mt-12 text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No related products found
        </p>
      </div>
    );
  }

  console.log("🎨 Rendering related products:", products.length);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Related Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          console.log(`🔄 Rendering product ${product.id}:`, product.name);

          // EXACT SAME PATTERN as ProductList
          const images = product.images || [];
          const primaryImage =
            product.primary_image ||
            images.find((img: any) => img?.is_primary) ||
            images[0];

          console.log(`📸 Product ${product.id} image data:`, {
            images,
            primaryImage,
            imageUrl: primaryImage?.image_url,
          });

          const hasImage = primaryImage?.image_url && !imageErrors[product.id];
          const fullImageUrl = getFullImageUrl(primaryImage?.image_url);

          console.log(`🔗 Product ${product.id} final image URL:`, {
            hasImage,
            fullImageUrl,
            imageError: imageErrors[product.id],
          });

          const productPrice =
            typeof product.price === "string"
              ? parseFloat(product.price)
              : product.price;

          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {hasImage && fullImageUrl ? (
                    <img
                      src={fullImageUrl}
                      alt={primaryImage?.alt_text || product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onLoad={() => handleImageLoad(product.id)}
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

                  {/* Quick Add Button */}
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

                {/* Product Info */}
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
