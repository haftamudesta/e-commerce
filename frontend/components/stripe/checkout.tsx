"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { stripeService } from "@/lib/stripeApi";
import { CheckoutItem } from "@/lib/stripeApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StripeCheckoutProps {
  products?: CheckoutItem[];
  mode?: "payment" | "subscription";
  priceId?: string;
  className?: string;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  products = [],
  mode = "payment",
  priceId,
  className = "",
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = products;
  const total = items.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      router.push(
        `/auth/login?returnUrl=${encodeURIComponent("/stripe/checkout")}`,
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (mode === "subscription" && priceId) {
        // Handle subscription - customer_email is now optional
        const response = await stripeService.createSubscription({
          price_id: priceId,
          success_url: `${window.location.origin}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/stripe/cancel`,
          // customer_email is not needed as backend uses authenticated user
        });

        toast.success("Subscription created successfully!");

        // Clear session storage after successful subscription
        sessionStorage.removeItem("checkoutItems");

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
          mode: "payment",
        });

        toast.loading("Redirecting to Stripe...");

        // Clear session storage after successful redirect
        sessionStorage.removeItem("checkoutItems");

        // Redirect to Stripe Checkout
        window.location.href = response.url;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);

      if (err.response?.status === 401) {
        setError("Please log in to continue");
        toast.error("Please log in to continue");
        router.push(
          `/auth/login?returnUrl=${encodeURIComponent("/stripe/checkout")}`,
        );
      } else {
        const errorMessage =
          err.response?.data?.detail || "Failed to process payment";
        setError(errorMessage);
        toast.error(errorMessage);
      }
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
          Payment Summary
        </h2>

        <div className="space-y-2 mb-4">
          {items.map((product, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {product.name} x{product.quantity}
              </span>
              <span className="text-gray-900 dark:text-white font-medium">
                ${(product.price * product.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between py-3 border-t border-gray-200 dark:border-gray-700">
          <span className="font-bold text-gray-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">
            ${total.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading || !user}
          className="w-full mt-4 bg-lime-500 hover:bg-lime-600 text-white py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Processing...
            </span>
          ) : mode === "subscription" ? (
            "Subscribe Now"
          ) : (
            "Pay Now"
          )}
        </button>

        {!user && (
          <p className="text-xs text-center text-red-500 mt-2">
            Please log in to continue
          </p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
};

export default StripeCheckout;
