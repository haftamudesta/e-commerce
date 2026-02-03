"use client";

import { useState } from "react";
import { useProducts } from "../../contexts/ProductContext";
import { useCategories } from "../../contexts/CategoryContext";
import { useAuth } from "../../contexts/AuthContext";
import { Edit, Trash2, Plus, Eye, Filter, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductListProps {
  categoryId?: number;
  showFilters?: boolean;
}

export default function ProductList({
  categoryId,
  showFilters = true,
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

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setDeletingId(id);
      try {
        await deleteProduct(id);
      } catch (err) {
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    setTimeout(() => {
      applyFilters(newFilters);
    }, 500);
  };

  const applyFilters = (filterValues: any) => {
    fetchProducts({
      categoryId,
      status: filterValues.status || undefined,
      minPrice: filterValues.minPrice
        ? parseFloat(filterValues.minPrice)
        : undefined,
      maxPrice: filterValues.maxPrice
        ? parseFloat(filterValues.maxPrice)
        : undefined,
      search: filterValues.search || undefined,
    });
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });
    fetchProducts({ categoryId });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
      fetchProducts({ page: newPage, categoryId, ...filters });
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Products</h2>
          <p className="text-gray-600">
            {total} product{total !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex gap-3">
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
            >
              <Filter size={20} />
              Filters
            </button>
          )}

          {(user?.role === "admin" || user?.role === "seller") && (
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Plus size={20} />
              Add Product
            </Link>
          )}
        </div>
      </div>
      {showFilters && showFilterPanel && (
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  placeholder="Search products..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                placeholder="Min price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                placeholder="Max price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      {products.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No products found</p>
          {(user?.role === "admin" || user?.role === "seller") && (
            <Link
              href="/admin/products/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-48 bg-gray-200">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400">
                    <svg
                      className="w-16 h-16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      product.status === "published"
                        ? "bg-green-100 text-green-800"
                        : product.status === "out_of_stock"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {product.status.replace("_", " ")}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {product.quantity} in stock
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">
                    <Link
                      href={`/products/${product.id}`}
                      className="hover:text-blue-600"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <span className="font-bold text-lg text-blue-600">
                    ${parseFloat(product.price.toString()).toFixed(2)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description || "No description available"}
                </p>

                {product.category && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {product.category.name}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Eye size={16} />
                    View
                  </Link>

                  {(user?.role === "admin" || user?.role === "seller") && (
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-gray-600 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === product.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between items-center pt-6">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} products
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className={`px-3 py-1 rounded border ${
                page <= 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(5, Math.ceil(total / limit)) },
                (_, i) => {
                  const pageNum =
                    Math.max(
                      1,
                      Math.min(Math.ceil(total / limit) - 4, page - 2),
                    ) + i;

                  if (pageNum > 0 && pageNum <= Math.ceil(total / limit)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          page === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                },
              )}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page * limit >= total}
              className={`px-3 py-1 rounded border ${
                page * limit >= total
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
