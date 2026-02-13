"use client";

import { useState } from "react";
import { useCategories } from "../../contexts/CategoryContext";
import { useAuth } from "../../contexts/AuthContext";
import { Edit, Trash2, Plus } from "lucide-react";
import Link from "next/link";

interface CategoryListContextProps {
  onEdit?: (category: any) => void;
}

export default function CategoryListContext({
  onEdit,
}: CategoryListContextProps) {
  const {
    categories,
    loading,
    error,
    total,
    page,
    limit,
    deleteCategory,
    setPage,
    clearError,
  } = useCategories();

  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      setDeletingId(id);
      try {
        await deleteCategory(id);
      } catch (err) {
        // Error is already set in context
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
    }
  };

  if (loading && categories.length === 0) {
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl text-center font-bold text-gray-800 ">
          Categories
        </h2>
        {user?.role === "admin" && (
          <Link
            href="/dashboard/categories/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus size={20} />
            Add Category
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No categories found</p>
          {user?.role === "admin" && (
            <Link
              href="dashboard/categories/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first category
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden ">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                {user?.role === "admin" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/categories/${category.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {category.name}
                    </Link>
                  </td>
                  {user?.role === "admin" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit?.(category)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === category.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > limit && (
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} categories
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
            <span className="px-3 py-1 bg-blue-600 text-white rounded">
              {page}
            </span>
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
