import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { stripeService } from "@/lib/stripeApi";

const SuccessPage: React.FC = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (session_id) {
      fetchSessionStatus();
    }
  }, [session_id]);

  const fetchSessionStatus = async () => {
    try {
      const data = await stripeService.getSessionStatus(session_id as string);
      setSession(data);
    } catch (error) {
      console.error("Failed to fetch session status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your payment has been processed
            successfully.
          </p>

          {session && (
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Payment Details:</h3>
              <p>Session ID: {session.session_id}</p>
              <p>Payment Status: {session.payment_status}</p>
              {session.amount_total && (
                <p>Amount: ${(session.amount_total / 100).toFixed(2)}</p>
              )}
              {session.customer_email && (
                <p>Customer Email: {session.customer_email}</p>
              )}
            </div>
          )}

          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
