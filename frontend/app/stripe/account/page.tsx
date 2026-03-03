"use client";

import React, { useEffect, useState } from "react";
import { stripeService, SubscriptionStatusResponse } from "@/lib/stripeApi";

const AccountPage: React.FC = () => {
  const [subscription, setSubscription] =
    useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string>("cus_example");

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [customerId]);

  const fetchSubscriptionStatus = async () => {
    try {
      const data = await stripeService.getSubscriptionStatus(customerId);
      setSubscription(data);
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await stripeService.createPortalSession(
        window.location.href,
        customerId,
      );
      window.location.href = response.url;
    } catch (error) {
      console.error("Failed to create portal session:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>

          {subscription?.is_subscribed ? (
            <div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-700 font-medium">Active</span>
              </div>

              {subscription.subscription_end_date && (
                <p className="text-gray-600 mb-4">
                  Renews on:{" "}
                  {new Date(
                    parseInt(subscription.subscription_end_date) * 1000,
                  ).toLocaleDateString()}
                </p>
              )}

              <button
                onClick={handleManageBilling}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Manage Billing
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                You don't have an active subscription.
              </p>
              <button
                onClick={() => (window.location.href = "/checkout")}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Subscribe Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
