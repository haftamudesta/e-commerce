"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function StripeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: "Checkout", href: "/stripe/checkout" },
    { name: "Account", href: "/stripe/account" },
  ];

  // Don't show navigation on success/cancel pages
  const hideNavigation =
    pathname?.includes("/stripe/success") ||
    pathname?.includes("/stripe/cancel");

  return (
    <div className="min-h-screen">
      {!hideNavigation && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-8">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
