"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StripeCheckout from "@/components/stripe/checkout";
import { CheckoutItem } from "@/lib/stripeApi";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, ShoppingBag, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const mode =
    (searchParams.get("mode") as "payment" | "subscription") || "payment";
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to initialize
    if (!authLoading) {
      if (!user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(
          "/stripe/checkout" + window.location.search,
        );
        router.push(`/auth/login?returnUrl=${returnUrl}`);
        return;
      }

      // Load checkout items
      loadCheckoutItems();
    }
  }, [user, authLoading, router]);

  const loadCheckoutItems = () => {
    try {
      const storedItems = sessionStorage.getItem("checkoutItems");
      console.log("📦 Raw stored items:", storedItems);

      if (!storedItems) {
        setError("No items to checkout");
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(storedItems);
      console.log("✅ Parsed items:", parsed);

      // Handle different formats
      let items: CheckoutItem[] = [];

      if (Array.isArray(parsed)) {
        items = parsed;
        console.log("📦 Items is an array with length:", items.length);
      } else if (parsed && typeof parsed === "object") {
        items = [parsed];
        console.log("📦 Items is a single object");
      }

      // Validate items
      const validItems = items.filter(
        (item) =>
          item &&
          typeof item.name === "string" &&
          typeof item.price === "number" &&
          typeof item.quantity === "number" &&
          item.currency,
      );

      console.log("✅ Valid items:", validItems);

      if (validItems.length > 0) {
        setCheckoutItems(validItems);
        // DON'T clear here - let the StripeCheckout component use it
        // The component will handle clearing after successful payment
      } else {
        setError("No valid items found");
      }
    } catch (error) {
      console.error("❌ Error loading checkout:", error);
      setError("Failed to load checkout items");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return checkoutItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-lime-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checkout items are loading
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-lime-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || checkoutItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error || "No Items to Checkout"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error
                ? "There was an error loading your items."
                : "Your checkout is empty."}
            </p>
            <Link
              href="/dashboard/products"
              className="inline-block bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-md transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Products
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Complete Your Purchase
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Checkout as{" "}
          <span className="font-medium text-lime-600">{user?.email}</span>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Order Summary */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>

            {checkoutItems.map((product, index) => (
              <div
                key={index}
                className="border-b border-gray-200 dark:border-gray-700 py-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Quantity: {product.quantity}
                      </p>
                      <p className="text-sm font-medium text-lime-600 dark:text-lime-400">
                        {formatPrice(product.price)} each
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(product.price * product.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Checkout */}
        <div className="lg:w-96">
          <StripeCheckout
            products={checkoutItems}
            mode={mode}
            priceId={mode === "subscription" ? "price_123456789" : undefined}
            className="sticky top-4"
          />
        </div>
      </div>
    </div>
  );
}
