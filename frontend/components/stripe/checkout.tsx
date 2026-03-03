import React, { useState } from "react";
import { useRouter } from "next/router";
import { stripeService, CheckoutItem } from "@/lib/stripeApi";

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const products: CheckoutItem[] = [
    {
      name: "Premium Plan",
      description: "Access to all premium features",
      price: 29.99,
      quantity: 1,
      image: "https://example.com/product-image.jpg",
      currency: "usd",
    },
  ];

  const handleOneTimePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await stripeService.createCheckoutSession({
        items: products,
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cancel`,
        customer_email: "customer@example.com",
        mode: "payment",
      });

      window.location.href = response.url;
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to create checkout session",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await stripeService.createSubscription({
        price_id: "price_123456789",
        customer_email: "customer@example.com",
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cancel`,
      });

      console.log("Subscription created:", response);
      router.push(
        `/subscription-confirm?subscription_id=${response.subscription_id}`,
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          {products.map((product, index) => (
            <div key={index} className="flex justify-between py-2 border-b">
              <div>
                <span className="font-medium">{product.name}</span>
                <span className="text-gray-600 ml-2">x{product.quantity}</span>
              </div>
              <span>${(product.price * product.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div className="flex justify-between py-2 font-bold">
            <span>Total</span>
            <span>
              $
              {products
                .reduce((sum, p) => sum + p.price * p.quantity, 0)
                .toFixed(2)}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleOneTimePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>

            <button
              onClick={handleSubscription}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Subscribe Monthly"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
