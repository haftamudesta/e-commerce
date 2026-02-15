"use client";

import { useState, useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useCategories } from "@/contexts/CategoryContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Archive,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ProductListProps {
  categoryId?: number;
  showFilters?: boolean;
  limit?: number;
  initialPage?: number;
}

export default function ProductList({
  categoryId,
  showFilters = true,
  limit: initialLimit = 12,
  initialPage = 1,
}: ProductListProps) {
  const {
    products,
    loading,
    error,
    total,
    page,
    limit,
    deleteProduct,
    fetchProducts,
    setPage,
    setLimit,
    clearError,
  } = useProducts();

  const { categories } = useCategories();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    status: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryId?.toString() || "",
  );
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  // API base URL - from environment or default
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchProducts({
      page: initialPage,
      limit: initialLimit,
      categoryId,
    });
  }, [categoryId, initialPage, initialLimit, fetchProducts]);

  useEffect(() => {
    setSelectedCategory(categoryId?.toString() || "");
  }, [categoryId]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setDeletingId(id);
      try {
        await deleteProduct(id);
      } catch (err) {
        console.error("Error deleting product:", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    setPage(1);
    fetchProducts({
      page: 1,
      limit,
      categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
      status: filters.status || undefined,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      search: filters.search || undefined,
    });
    setShowFilterPanel(false);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });
    setSelectedCategory(categoryId?.toString() || "");
    setPage(1);
    fetchProducts({
      page: 1,
      limit,
      categoryId,
    });
    setShowFilterPanel(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
      fetchProducts({
        page: newPage,
        limit,
        categoryId: selectedCategory ? parseInt(selectedCategory) : categoryId,
        status: filters.status || undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        search: filters.search || undefined,
      });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchProducts({
      page: 1,
      limit: newLimit,
      categoryId: selectedCategory ? parseInt(selectedCategory) : categoryId,
      status: filters.status || undefined,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      search: filters.search || undefined,
    });
  };

  const handleImageError = (productId: number) => {
    console.log(`Image failed to load for product ${productId}`);
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const handleImageLoad = (productId: number) => {
    console.log(`Image loaded successfully for product ${productId}`);
    setLoadedImages((prev) => ({ ...prev, [productId]: true }));
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "draft":
        return <Clock className="w-3 h-3 mr-1" />;
      case "archived":
        return <Archive className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Active";
      case "draft":
        return "Draft";
      case "archived":
        return "Archived";
      default:
        return status || "Unknown";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const totalPages = Math.ceil(total / limit);
  const canAddProduct = user?.role === "admin" || user?.role === "seller";

  // Log products for debugging
  console.log("Products received:", products);

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Error loading products
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={clearError}
              className="mt-3 text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Try again
            </button>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} product{total !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilterPanel
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={20} />
              <span className="hidden sm:inline">Filters</span>
              {(filters.search ||
                filters.status ||
                filters.minPrice ||
                filters.maxPrice ||
                selectedCategory) && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).filter(Boolean).length +
                    (selectedCategory ? 1 : 0)}
                </span>
              )}
            </button>
          )}

          {canAddProduct && (
            <Link
              href="/dashboard/products/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Product</span>
            </Link>
          )}
        </div>
      </div>

      {showFilters && showFilterPanel && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Filter Products
            </h3>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search products..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    onKeyPress={handleKeyPress}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    onKeyPress={handleKeyPress}
                    placeholder="Any"
                    min="0"
                    step="0.01"
                    className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-1">
            {canAddProduct
              ? "Get started by creating your first product"
              : "Check back later for new products"}
          </p>
          {canAddProduct && (
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create Product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              // Safely access images - ensure images is always an array
              const images = product.images || [];
              const primaryImage =
                product.primary_image ||
                images.find((img) => img?.is_primary) ||
                images[0];
              const hasImage =
                primaryImage?.image_url && !imageErrors[product.id];
              const fullImageUrl = getFullImageUrl(primaryImage?.image_url);

              // Log image URL for debugging
              if (primaryImage?.image_url) {
                console.log(`Product ${product.id} image URL:`, {
                  original: primaryImage.image_url,
                  full: fullImageUrl,
                  hasImage,
                });
              }

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="block relative"
                  >
                    <div className="relative h-56 bg-gray-100 overflow-hidden">
                      {hasImage && fullImageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fullImageUrl}
                            alt={primaryImage?.alt_text || product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={() => handleImageError(product.id)}
                            onLoad={() => handleImageLoad(product.id)}
                          />
                          {primaryImage?.is_primary && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900 shadow-sm">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Primary
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                          <span className="mt-2 text-xs text-gray-500">
                            No image
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(product.status)}`}
                        >
                          {getStatusIcon(product.status)}
                          {getStatusLabel(product.status)}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.quantity > 10
                              ? "bg-green-100 text-green-800"
                              : product.quantity > 0
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.quantity > 0
                            ? `${product.quantity} in stock`
                            : "Out of stock"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-5">
                    {product.category?.name && (
                      <div className="mb-2">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {product.category?.name}
                        </span>
                      </div>
                    )}

                    <Link href={`/dashboard/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {product.description || "No description available"}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.quantity > 0 && product.quantity <= 5 && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          Low stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <Eye size={18} />
                        View Details
                      </Link>

                      {(user?.role === "admin" || user?.role === "seller") && (
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/products/${product.id}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Product"
                          >
                            {deletingId === product.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} products
                </span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                  <option value={96}>96 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-10 h-10 px-2 rounded-lg border ${
                          page === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page * limit >= total}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
