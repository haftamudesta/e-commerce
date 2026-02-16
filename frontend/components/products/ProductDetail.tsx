"use client";

import { useState, useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useReviews } from "@/contexts/ReviewContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Edit,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Package,
  Tag,
  Calendar,
  Star,
  MessageCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import ProductForm from "./ProductForm";
import ProductReviews from "./ProductReviews";

interface ProductDetailProps {
  productId: number;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const {
    currentProduct,
    loading,
    error,
    fetchProduct,
    deleteProduct,
    clearCurrentProduct,
    clearError,
  } = useProducts();

  const { stats, fetchStats } = useReviews();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
      fetchStats(productId);
    }
    return () => {
      clearCurrentProduct();
    };
  }, [productId, fetchProduct, fetchStats, clearCurrentProduct]);

  // Log product data for debugging
  useEffect(() => {
    if (currentProduct) {
      console.log("Current product:", currentProduct);
      console.log("Product images:", currentProduct.images);
      console.log("Primary image:", currentProduct.primary_image);
    }
  }, [currentProduct]);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteProduct(productId);
        window.location.href = "/dashboard/products";
      } catch (error) {
        console.error("Error deleting product:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity} ${currentProduct?.name} to cart!`);
  };

  const incrementQuantity = () => {
    if (currentProduct && quantity < currentProduct.quantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const getFullImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Ensure the URL starts with a slash
    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${API_BASE_URL}${cleanUrl}`;
  };

  const handleImageError = (imageId: number) => {
    console.log(`Image failed to load for image ID ${imageId}`);
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
  };

  const handleImageLoad = (imageId: number) => {
    console.log(`Image loaded successfully for image ID ${imageId}`);
    setLoadedImages((prev) => ({ ...prev, [imageId]: true }));
  };

  const nextImage = () => {
    if (
      currentProduct?.images &&
      selectedImage < currentProduct.images.length - 1
    ) {
      setSelectedImage((prev) => prev + 1);
    }
  };

  const prevImage = () => {
    if (selectedImage > 0) {
      setSelectedImage((prev) => prev - 1);
    }
  };

  if (loading && !currentProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex justify-between items-center">
          <span>Error: {error}</span>
          <button
            onClick={clearError}
            className="text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
        <Link
          href="/dashboard/products"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          Go back to products
        </Link>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Product not found</p>
        <Link
          href="/dashboard/products"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          Go back to products
        </Link>
      </div>
    );
  }

  const price = parseFloat(currentProduct.price.toString());
  const isOutOfStock =
    currentProduct.quantity === 0 || currentProduct.status === "archived";

  // Safely access images - same pattern as ProductList
  const images = currentProduct.images || [];
  const primaryImage =
    currentProduct.primary_image ||
    images.find((img) => img?.is_primary) ||
    images[0];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[selectedImage] || primaryImage : null;
  const fullImageUrl = getFullImageUrl(currentImage?.image_url);
  const hasImageError = currentImage?.id ? imageErrors[currentImage.id] : false;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Products
        </Link>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Edit Product
          </h2>
          <ProductForm
            productId={productId}
            onSuccess={() => {
              setIsEditing(false);
              fetchProduct(productId);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Product Details
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "reviews"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <MessageCircle size={16} />
                Reviews
                {stats?.total_reviews ? (
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {stats.total_reviews}
                  </span>
                ) : null}
              </button>
            </nav>
          </div>

          {activeTab === "details" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Images */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-4">
                  {/* Main Image */}
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {hasImages && fullImageUrl && !hasImageError ? (
                      <>
                        <img
                          src={fullImageUrl}
                          alt={currentImage?.alt_text || currentProduct.name}
                          className="w-full h-full object-cover"
                          onError={() =>
                            currentImage?.id &&
                            handleImageError(currentImage.id)
                          }
                          onLoad={() =>
                            currentImage?.id && handleImageLoad(currentImage.id)
                          }
                        />
                        {currentImage?.is_primary && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Primary
                            </span>
                          </div>
                        )}

                        {/* Image Navigation */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              disabled={selectedImage === 0}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={nextImage}
                              disabled={selectedImage === images.length - 1}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Image Counter */}
                        {images.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {selectedImage + 1} / {images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          {hasImages
                            ? "Image failed to load"
                            : "No image available"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {images.map((image, index) => {
                        const thumbUrl = getFullImageUrl(
                          image.thumbnail_url || image.image_url,
                        );
                        const hasThumbError = image.id
                          ? imageErrors[image.id]
                          : false;

                        return (
                          <button
                            key={image.id || index}
                            onClick={() => setSelectedImage(index)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                              selectedImage === index
                                ? "border-blue-500"
                                : "border-transparent hover:border-gray-300"
                            }`}
                          >
                            {thumbUrl && !hasThumbError ? (
                              <img
                                src={thumbUrl}
                                alt={image.alt_text || `Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={() =>
                                  image.id && handleImageError(image.id)
                                }
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            {image.is_primary && (
                              <div className="absolute top-1 left-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                {(user?.role === "admin" || user?.role === "seller") && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Manage Product
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        disabled={loading}
                      >
                        <Edit size={18} />
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting || loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews Summary Card */}
                {stats && stats.total_reviews > 0 && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Star className="text-yellow-400 fill-current" />
                      Customer Reviews
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {stats.average_rating}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(stats.average_rating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-gray-600">
                        {stats.total_reviews}{" "}
                        {stats.total_reviews === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      Read all reviews →
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            currentProduct.status === "active"
                              ? "bg-green-100 text-green-800"
                              : currentProduct.status === "archived"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {currentProduct.status.replace("_", " ")}
                        </span>
                        {currentProduct.category_name && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {currentProduct.category_name}
                          </span>
                        )}
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {currentProduct.name}
                      </h1>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      ${price.toFixed(2)}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      Description
                    </h2>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {currentProduct.description ||
                        "No description available."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Package className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">
                          Quantity Available
                        </p>
                        <p className="font-medium">
                          {currentProduct.quantity} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">SKU</p>
                        <p className="font-medium">
                          PROD-{currentProduct.id.toString().padStart(6, "0")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium">
                          {new Date(
                            currentProduct.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Updated</p>
                        <p className="font-medium">
                          {new Date(
                            currentProduct.updated_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    {isOutOfStock ? (
                      <div className="text-center py-4">
                        <p className="text-red-600 font-medium mb-2">
                          Out of Stock
                        </p>
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                        >
                          Currently Unavailable
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={decrementQuantity}
                                disabled={quantity <= 1}
                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-medium">
                                {quantity}
                              </span>
                              <button
                                onClick={incrementQuantity}
                                disabled={quantity >= currentProduct.quantity}
                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ${(price * quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleAddToCart}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                          >
                            <ShoppingCart size={20} />
                            Add to Cart
                          </button>
                          <button className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium">
                            Buy Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Additional Information
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Product ID</span>
                      <span className="font-medium">#{currentProduct.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium capitalize">
                        {currentProduct.status}
                      </span>
                    </div>
                    {currentProduct.slug && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Slug</span>
                        <span className="font-medium">
                          {currentProduct.slug}
                        </span>
                      </div>
                    )}
                    {currentProduct.category_name && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium">
                          {currentProduct.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <ProductReviews
                productId={productId}
                productName={currentProduct.name}
                showTitle={true}
                limit={10}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
