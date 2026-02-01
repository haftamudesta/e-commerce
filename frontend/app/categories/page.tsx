"use client";

import { useState, useEffect } from "react";
import CategoryList from "../components/categories/CategoriesList";
import CategoryForm from "../components/categories/CategoryForm";
import { Search } from "lucide-react";
import { useCategories } from "../contexts/CategoryContext";

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { searchCategories, loading } = useCategories();
  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim()) {
        try {
          const results = await searchCategories(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCategories]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-center items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Product Categories
          </h1>
          <p className="mt-2 text-gray-600">
            Browse and manage product categories in our store
          </p>
        </div>
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-100 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {searchTerm && searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-w-md">
              <div className="p-2">
                <p className="text-sm text-gray-500 mb-2">Search results:</p>
                {searchResults.map((category) => (
                  <div
                    key={category.id}
                    className="p-2 hover:bg-gray-50 rounded"
                  >
                    <a
                      href={`/categories/${category.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {category.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {showForm ? (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Create New Category
                </h2>
                <CategoryForm
                  onSuccess={() => {
                    setShowForm(false);
                    alert("Category created successfully!");
                  }}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : (
              <CategoryList onEdit={() => setShowForm(true)} />
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Categories
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {loading ? "..." : "24"}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Active Products
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">156</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Last Updated
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                Today
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
