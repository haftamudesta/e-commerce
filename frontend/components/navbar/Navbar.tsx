"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, ShoppingBag, Settings, Heart } from "lucide-react";
import CartIcon from "@/components/icons/CartIcon";
import FavoriteIcon from "@/components/icons/FavoriteIcon";
import useStore from "@/store";
import ThemeToggler from "../theme/ThemeToggler";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const favoritesCount = useStore((state) => state.getFavoriteCount());

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
    }, 500);
  };

  return (
    <nav
      style={{
        background: "linear-gradient(90deg, #FF6B6B 0%, #FFE66D 100%)",
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag size={32} strokeWidth={1.5} absoluteStrokeWidth />
            <span className="font-bold text-xl">E-Commerce App</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Home
            </Link>

            {user?.role === "admin" && (
              <Link href="/dashboard">
                <Button
                  variant={pathname === "/dashboard" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <FavoriteIcon />
          <CartIcon />
          <ThemeToggler />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full bg-sky-700 hover:bg-sky-800"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm font-bold text-white bg-purple-600">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
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
                  <Link href="/cart" className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Carts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites" className="cursor-pointer">
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
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
