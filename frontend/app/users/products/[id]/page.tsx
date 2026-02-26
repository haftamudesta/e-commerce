"use client";

import { useParams } from "next/navigation";
import ProductDetail from "@/components/products/ProductDetail";
import { Suspense } from "react";
import Link from "next/link";

function ProductPageContent() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  if (isNaN(productId)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Invalid product ID
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{
        background:
          "linear-gradient(145deg, #0a4b6e 0%, #1e6f9f 50%, #3b9bd7 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetail productId={productId} />
        <div className="mt-12">
          <Link
            href={"/contact"}
            className="text-2xl font-bold text-gray-800 mb-6"
          >
            Would love to hear your feedback.Message me anytime
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      }
    >
      <ProductPageContent />
    </Suspense>
  );
}
