"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { stripeService, SubscriptionStatusResponse } from "@/lib/stripeApi";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountPage() {
  const [subscription, setSubscription] =
    useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const { user } = useAuth();

  const customerEmail = user?.email;

  useEffect(() => {
    if (customerEmail) {
      fetchOrCreateStripeCustomer();
    } else {
      setLoading(false);
    }
  }, [customerEmail]);

  const fetchOrCreateStripeCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const searchResult = await stripeService.searchCustomer(customerEmail!);

      let customerId;

      if (searchResult.customer_id) {
        customerId = searchResult.customer_id;
        console.log("Found existing customer:", customerId);
      } else {
        const newCustomer = await stripeService.createCustomer(
          customerEmail!,
          user?.username || customerEmail?.split("@")[0],
        );
        customerId = newCustomer.customer_id;
        console.log("Created new customer:", customerId);
      }

      setStripeCustomerId(customerId);
      if (customerId) {
        const data = await stripeService.getSubscriptionStatus(customerId);
        setSubscription(data);
      }
    } catch (err: any) {
      console.error("Error in fetchOrCreateStripeCustomer:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load account details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) {
      toast.error("Unable to manage billing: Customer ID not found");
      return;
    }

    try {
      setLoading(true);
      const response = await stripeService.createPortalSession(
        window.location.href,
        stripeCustomerId,
      );
      window.location.href = response.url;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Failed to open billing portal";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please Sign In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to view your account details.
          </p>
          <Link
            href="/sign-in"
            className="inline-block bg-lime-500 hover:bg-lime-600 text-white py-3 px-8 rounded-md transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading account details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Account Settings
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={fetchOrCreateStripeCustomer}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Account Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>
              {stripeCustomerId && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stripe Customer ID
                  </p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {stripeCustomerId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Subscription Status
            </h2>
          </div>
          <div className="p-6">
            {subscription?.is_subscribed ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Active Subscription
                  </span>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Subscription ID
                      </p>
                      <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                        {subscription.subscription_id}
                      </p>
                    </div>
                    {subscription.subscription_end_date && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Renewal Date
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(subscription.subscription_end_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="w-full bg-lime-500 hover:bg-lime-600 text-white py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? "Loading..." : "Manage Subscription & Billing"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 12H4M12 4v16"
                  ></path>
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have an active subscription.
                </p>
                <Link
                  href="/stripe/checkout?mode=subscription"
                  className="inline-block bg-lime-500 hover:bg-lime-600 text-white py-3 px-8 rounded-md transition-colors font-medium"
                >
                  View Subscription Plans
                </Link>
              </div>
            )}
          </div>
        </div>

        {subscription?.is_subscribed && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Billing Information
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button
                  onClick={handleManageBilling}
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400">
                        Payment Methods
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your credit cards and payment methods
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-lime-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </button>

                <button
                  onClick={handleManageBilling}
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400">
                        Billing History
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View past invoices and receipts
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-lime-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/stripe/checkout"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Make a Payment
              </Link>
              <Link
                href="/stripe/checkout?mode=subscription"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Subscribe
              </Link>
              <button
                onClick={fetchOrCreateStripeCustomer}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
