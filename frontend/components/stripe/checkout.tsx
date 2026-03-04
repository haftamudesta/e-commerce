"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { stripeService, CheckoutItem } from "@/lib/stripeApi";
import { toast } from "sonner";

interface StripeCheckoutProps {
  products?: CheckoutItem[];
  mode?: "payment" | "subscription";
  customerEmail?: string;
  priceId?: string;
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  products = [],
  mode = "payment",
  customerEmail,
  priceId,
  onSuccess,
  onError,
  className = "",
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultProducts: CheckoutItem[] = [
    {
      name: "Premium Plan",
      description: "Access to all premium features",
      price: 29.99,
      quantity: 1,
      currency: "usd",
    },
  ];

  const items = products.length > 0 ? products : defaultProducts;
  const total = items.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === "subscription" && priceId) {
        // Handle subscription
        const response = await stripeService.createSubscription({
          price_id: priceId,
          customer_email: customerEmail || "customer@example.com",
          success_url: `${window.location.origin}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/stripe/cancel`,
        });

        toast.success("Subscription created successfully!");

        if (response.client_secret) {
          router.push(
            `/stripe/checkout/confirm?subscription_id=${response.subscription_id}`,
          );
        }
      } else {
        // Handle one-time payment
        const response = await stripeService.createCheckoutSession({
          items,
          success_url: `${window.location.origin}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/stripe/cancel`,
          customer_email: customerEmail,
          mode: "payment",
        });

        // Show loading toast
        toast.loading("Redirecting to Stripe...");

        // Redirect to Stripe Checkout
        window.location.href = response.url;
      }

      if (onSuccess) onSuccess("session_created");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to process payment";
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Order Summary
        </h2>

        {items.map((product, index) => (
          <div
            key={index}
            className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
          >
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {product.name}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                x{product.quantity}
              </span>
              {product.description && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {product.description}
                </p>
              )}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              ${(product.price * product.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        <div className="flex justify-between py-3 font-bold text-lg text-gray-900 dark:text-white">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full mt-4 bg-lime-500 hover:bg-lime-600 text-white py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : mode === "subscription" ? (
            "Subscribe Now"
          ) : (
            "Pay Now"
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
};

export default StripeCheckout;
