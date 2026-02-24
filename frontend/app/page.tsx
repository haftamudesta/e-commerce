"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ProductList from "@/components/products/ProductList";
import Image from "next/image";

export default function Home() {
  return (
    <ProtectedRoute>
      <main
        className="flex flex-col"
        style={{
          background:
            "linear-gradient(145deg, #0a4b6e 0%, #1e6f9f 50%, #3b9bd7 100%)",
        }}
      >
        <div className="relative w-full h-48 mb-8 overflow-hidden rounded-lg">
          <Image
            src="https://cdn.freecodecamp.org/curriculum/labs/past-event2.jpg"
            alt="Welcome banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-emerald-400 bg-white text-center max-w-2xl px-4 py-6 text-lg md:text-xl font-medium w-1/2 rounded-full">
              Welcome to My E-commerce App! I am here to satisfy your every
              desire, offering a handpicked collection of the best products just
              for you. Sit back, browse, and let me take care of the rest. Happy
              shopping!
            </p>
          </div>
        </div>

        {/* Products List */}
        <ProductList />
      </main>
    </ProtectedRoute>
  );
}
