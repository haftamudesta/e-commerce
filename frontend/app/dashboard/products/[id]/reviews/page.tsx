"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout";
import ProductReviews from "@/components/products/ProductReviews";
import { useProducts } from "@/contexts/ProductContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProductReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  const { fetchProduct, currentProduct, loading } = useProducts();

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-500">Loading product...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/products/${productId}`}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                Reviews for {currentProduct?.name || "Product"}
              </h1>
              <p className="text-blue-100 mt-1">
                Customer feedback and ratings
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <ProductReviews
            productId={productId}
            productName={currentProduct?.name}
            showTitle={false}
            limit={10}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
