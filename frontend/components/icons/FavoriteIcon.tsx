import React from "react";
import useCartStore from "../../store";
import Link from "next/link";
import { Heart } from "lucide-react";

const FavoriteIcon = () => {
  const { favoriteProduct } = useCartStore();
  const getFavoriteCount = () => {
    if (!Array.isArray(favoriteProduct) || favoriteProduct.length === 0) {
      return 0;
    }
    return favoriteProduct.length > 9 ? "9+" : favoriteProduct.length;
  };

  return (
    <Link
      href="/wishlist"
      className="group relative hover:text-gofarm-light-green hoverEffect"
    >
      <Heart className="group-hover:text-gofarm-light-green hoverEffect" />
      <span
        className={`absolute -top-1 -right-1 bg-gofarm-green text-gofarm-white rounded-full text-xs font-semibold flex items-center justify-center min-w-3.5 h-3.5 ${
          Array.isArray(favoriteProduct) && favoriteProduct.length > 9
            ? "px-1"
            : ""
        }`}
      >
        {getFavoriteCount()}
      </span>
    </Link>
  );
};

export default FavoriteIcon;
