"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { stripeService, SubscriptionStatusResponse } from "@/lib/stripeApi";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  CreditCard,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  User,
} from "lucide-react";

export default function AccountPage() {
  const [subscription, setSubscription] =
    useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!authLoading) {
      if (user) {
        fetchSubscriptionStatus();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await stripeService.getSubscriptionStatus();
      console.log("Subscription status:", data);
      setSubscription(data);
    } catch (err: any) {
      console.error("Error fetching subscription:", err);
      if (err.response?.status === 401) {
        setError("Please log in to view your subscription");
      } else {
        setError(
          err.response?.data?.detail || "Failed to load subscription status",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSubscriptionStatus();
      toast.success("Subscription status updated");
    } catch (err) {
      toast.error("Failed to refresh status");
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      const response = await stripeService.createPortalSession(
        window.location.href,
      );
      window.location.href = response.url;
    } catch (err: any) {
      console.error("Error:", err);
      if (err.response?.status === 401) {
        setError("Please log in to manage billing");
      } else {
        setError(err.response?.data?.detail || "Failed to open billing portal");
      }
      toast.error("Failed to open billing portal");
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please Sign In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to view your subscription details.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-lime-500 hover:bg-lime-600 text-white py-3 px-8 rounded-md transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Show loading while fetching subscription data
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-lime-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading subscription details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Subscription Settings
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6">
        {/* Account Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Account Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Username
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {user.role}
                </p>
              </div>

              {subscription?.stripe_customer_id && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Stripe Customer ID
                  </p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 break-all">
                    {subscription.stripe_customer_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Subscription Status
            </h2>
          </div>
          <div className="p-6">
            {subscription?.is_subscribed ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                    <CheckCircle size={18} />
                    Active Subscription
                  </span>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <FileText size={14} />
                        Subscription ID
                      </p>
                      <p className="font-mono text-xs text-gray-900 dark:text-white break-all mt-1">
                        {subscription.subscription_id}
                      </p>
                    </div>
                    {subscription.subscription_end_date && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar size={14} />
                          Renewal Date
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
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
                  Manage Subscription & Billing
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
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

        {/* Quick Actions */}
        {subscription?.is_subscribed && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Quick Actions
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleManageBilling}
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div className="p-2 bg-lime-100 dark:bg-lime-900/30 rounded-lg group-hover:bg-lime-200 dark:group-hover:bg-lime-900/50 transition-colors">
                    <CreditCard className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Payment Methods
                    </h3>
                    <p className="text-sm text-gray-500">
                      Update your payment methods
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleManageBilling}
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Invoices
                    </h3>
                    <p className="text-sm text-gray-500">
                      View billing history
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
