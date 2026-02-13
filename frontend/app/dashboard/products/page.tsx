"use client";

import { Suspense } from "react";
import ProductList from "@/components/products/ProductList";
import { Filter, Grid, List } from "lucide-react";
import { useState } from "react";

function ProductsPageContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Products
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover our wide range of high-quality products. From the latest
            trends to timeless classics, find exactly what you're looking for.
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-r ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
              >
                <List size={20} />
              </button>
            </div>
            <span className="text-sm text-gray-500">Showing all products</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>Sort by:</span>
            <select className="border-none bg-transparent focus:outline-none focus:ring-0">
              <option>Latest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name A-Z</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <ProductList showFilters />
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Quality Guaranteed
            </h3>
            <p className="text-gray-600">
              All our products are carefully selected for quality and
              durability.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Fast Shipping
            </h3>
            <p className="text-gray-600">
              Get your orders delivered quickly with our reliable shipping
              partners.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Easy Returns
            </h3>
            <p className="text-gray-600">
              Not satisfied? Return your purchase within 30 days for a full
              refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
