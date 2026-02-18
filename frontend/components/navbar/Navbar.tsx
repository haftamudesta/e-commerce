"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  User,
  ShoppingBag,
  Settings,
  Heart,
  Menu,
  X,
} from "lucide-react";
import CartIcon from "@/components/icons/CartIcon";
import FavoriteIcon from "@/components/icons/FavoriteIcon";
import useStore from "@/store";
import ThemeToggler from "../theme/ThemeToggler";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const favoritesCount = useStore((state) => state.getFavoriteCount());
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
    }, 500);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 transition-colors duration-300">
      <div
        className="absolute inset-0 -z-10 transition-colors duration-300"
        style={{
          background: isDarkMode
            ? "linear-gradient(90deg, #FF6B6B 0%, #FFE66D 100%)"
            : "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
        }}
      />

      <div className="container-custom h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <ShoppingBag
            size={32}
            strokeWidth={1.5}
            className="text-white group-hover:scale-110 transition-transform"
          />
          <span className="font-bold text-xl text-white">E-Commerce App</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-white/90 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/products"
            className="text-white/90 hover:text-white transition-colors"
          >
            Products
          </Link>
          <Link
            href="/about"
            className="text-white/90 hover:text-white transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-white/90 hover:text-white transition-colors"
          >
            Contact
          </Link>

          {user?.role === "admin" && (
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FavoriteIcon />
          <CartIcon />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm font-bold bg-purple-600 text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="mt-1 w-fit"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/users/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist ({favoritesCount})
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="bg-white text-primary-600 hover:bg-white/90"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg">
          <div className="container-custom py-4 space-y-3">
            <Link
              href="/"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/products"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/about"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/dashboard"
                className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            {!user && (
              <div className="flex gap-2 pt-4 border-t dark:border-gray-800">
                <Link
                  href="/sign-in"
                  className="flex-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link
                  href="/sign-up"
                  className="flex-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
