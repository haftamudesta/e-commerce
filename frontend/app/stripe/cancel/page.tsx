"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
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
            Your payment was cancelled. No charges were made. You can try again
            whenever you're ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/stripe/checkout"
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="bg-gray-200 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-300 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
