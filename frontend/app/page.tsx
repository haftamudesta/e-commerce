"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ProductList from "@/components/products/ProductList";

export default function Home() {
  return (
    <ProtectedRoute>
      <main>
        <ProductList />
      </main>
    </ProtectedRoute>
  );
}
