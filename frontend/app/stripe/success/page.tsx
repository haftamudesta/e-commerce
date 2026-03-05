"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { stripeService } from "@/lib/stripeApi";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (sessionId && user) {
      fetchSessionStatus();
    } else if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
    }
  }, [sessionId, user, authLoading, router]);

  useEffect(() => {
    if (session?.mode === "subscription" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push("/stripe/account");
    }
  }, [countdown, session, router]);

  const fetchSessionStatus = async () => {
    try {
      const data = await stripeService.getSessionStatus(sessionId as string);
      console.log("Session status:", data);
      setSession(data);
    } catch (err: any) {
      console.error("Error fetching session:", err);
      setError(err.response?.data?.detail || "Failed to fetch session status");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubscription = () => {
    router.push("/stripe/account");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-lime-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {authLoading
              ? "Checking authentication..."
              : "Verifying your payment..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-red-800 dark:text-red-400 mb-2">
              Verification Error
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
            <Link
              href="/stripe/checkout"
              className="inline-flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-md transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Return to Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSubscription = session?.mode === "subscription";

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {isSubscription
              ? "Subscription Successful!"
              : "Payment Successful!"}
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {isSubscription
              ? "Thank you for subscribing. Your subscription has been activated successfully."
              : "Thank you for your purchase. Your payment has been processed successfully."}
          </p>

          {session && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg mb-8 text-left">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                Transaction Details:
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Session ID:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white break-all ml-4">
                    {session.session_id}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Payment Status:
                  </span>
                  <span className="capitalize font-medium text-green-600 dark:text-green-400">
                    {session.payment_status}
                  </span>
                </p>
                {session.amount_total && (
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Amount Paid:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${(session.amount_total / 100).toFixed(2)}
                    </span>
                  </p>
                )}
                {session.customer_email && (
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Email:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {session.customer_email}
                    </span>
                  </p>
                )}
                {isSubscription && session.subscription && (
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subscription ID:
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white break-all ml-4">
                      {session.subscription}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {isSubscription && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-700 dark:text-blue-300">
                Redirecting to your account in {countdown} seconds...
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSubscription ? (
              <button
                onClick={handleViewSubscription}
                className="bg-lime-500 hover:bg-lime-600 text-white py-3 px-8 rounded-md transition-colors font-medium"
              >
                View Subscription Now
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="bg-lime-500 hover:bg-lime-600 text-white py-3 px-8 rounded-4xl transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            )}
            <Link
              href="/"
              className="bg-emerald-300 text-gray-700 dark:text-sky-500 hover:bg-gray-300 dark:hover:bg-gray-600 py-3 px-8 rounded-4xl transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>

          {isSubscription && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              You can manage your subscription anytime from your account page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
