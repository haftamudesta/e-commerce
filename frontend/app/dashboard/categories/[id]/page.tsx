"use client";

import { useParams } from "next/navigation";
import CategoryDetailContext from "@/components/categories/CategoryDetail";
import { Suspense } from "react";

function CategoryPageContent() {
  const params = useParams();
  const categoryId = parseInt(params.id as string);

  if (isNaN(categoryId)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Invalid category ID
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryDetailContext categoryId={categoryId} />
      </div>
    </div>
  );
}

export default function CategoryPage() {
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
      <CategoryPageContent />
    </Suspense>
  );
}
