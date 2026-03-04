"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Payment Cancelled
          </h1>

          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges were made. If you encountered
            any issues, please try again or contact support.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-medium text-blue-800 mb-2">Need help?</h3>
            <p className="text-sm text-blue-600">
              If you're having trouble completing your purchase, please contact
              our support team at{" "}
              <a href="mailto:support@example.com" className="underline">
                support@example.com
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/stripe/checkout"
              className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="bg-gray-200 text-gray-700 py-3 px-8 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
