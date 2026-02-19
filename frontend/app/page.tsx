"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ProductList from "@/components/products/ProductList";
import Image from "next/image";

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="flex">
        <Image
          src="https://cdn.freecodecamp.org/curriculum/labs/past-event2.jpg"
          alt="image"
          fill
          style={{ objectFit: "cover" }}
        />
        <ProductList />
      </main>
    </ProtectedRoute>
  );
}
