import React, { useEffect, useState } from "react";
import { useCartCount } from "@/store";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface CartIconProps {
  showBadge?: boolean;
  className?: string;
  iconSize?: number;
  href?: string;
}

const CartIconLink = ({
  showBadge = true,
  className = "",
  iconSize = 24,
  href = "/cart",
}: CartIconProps) => {
  const itemCount = useCartCount();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);

  useEffect(() => {
    if (itemCount !== prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(itemCount);
      return () => clearTimeout(timer);
    }
  }, [itemCount, prevCount]);

  const getDisplayCount = () => {
    if (itemCount > 99) return "99+";
    return itemCount;
  };

  const displayCount = getDisplayCount();
  const hasItems = itemCount > 0;

  return (
    <Link
      href={href}
      className={`group relative focus:outline-none ${className}`}
      aria-label={`View cart (${itemCount} items)`}
    >
      <ShoppingCart
        size={iconSize}
        className={`
          transition-all duration-200
          text-gray-700 group-hover:text-primary-600
          dark:text-gray-300 dark:group-hover:text-primary-400
          ${isAnimating ? "scale-110" : "scale-100"}
        `}
      />

      {showBadge && hasItems && (
        <span
          className={`
            absolute -top-2 -right-2
            flex items-center justify-center
            bg-primary-600 text-white
            text-xs font-bold
            rounded-full
            min-w-5 h-5
            px-1
            shadow-md
            transition-all duration-200
            ${isAnimating ? "scale-125" : "scale-100"}
            animate-bounce-subtle
          `}
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
};

export default CartIconLink;
