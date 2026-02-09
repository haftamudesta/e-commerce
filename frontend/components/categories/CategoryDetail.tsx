"use client";

import { useState, useEffect } from "react";
import { useCategories } from "../../contexts/CategoryContext";
import { useAuth } from "../../contexts/AuthContext";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryForm from "./CategoryForm";

interface CategoryDetailContextProps {
  categoryId: number;
}

export default function CategoryDetailContext({
  categoryId,
}: CategoryDetailContextProps) {
  const {
    currentCategory,
    loading,
    error,
    fetchCategory,
    deleteCategory,
    clearCurrentCategory,
    clearError,
  } = useCategories();

  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchCategory(categoryId);
    }
    return () => {
      clearCurrentCategory();
    };
  }, [categoryId, fetchCategory, clearCurrentCategory]);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteCategory(categoryId);
        window.location.href = "/categories";
      } catch (error) {
        console.error("Error deleting category:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (loading && !currentCategory) {
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
        <Link
          href="/categories"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          Go back to categories
        </Link>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Category not found</p>
        <Link
          href="/categories"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          Go back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/categories"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Categories
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? "Edit Category" : currentCategory.name}
            </h1>

            {user?.role === "admin" && !isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  <Edit size={18} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            <CategoryForm
              category={currentCategory}
              onSuccess={() => {
                setIsEditing(false);
                alert("Category updated successfully!");
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Category Information
                </h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentCategory.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentCategory.name}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Placeholder for products in this category */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Products in this Category
                </h3>
                <p className="text-gray-500 italic">
                  Products feature coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
