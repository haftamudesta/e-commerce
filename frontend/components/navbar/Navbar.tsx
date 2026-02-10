"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              E-commerce
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/products"
                className="text-gray-600 hover:text-gray-900"
              >
                Products
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">Hello, {user.username}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
