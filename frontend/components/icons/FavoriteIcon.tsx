import React, { useEffect, useState } from "react";
import useStore, { useFavoritesItems } from "../../store";
import Link from "next/link";
import { Heart } from "lucide-react";

const FavoriteIcon = () => {
  const favoriteProduct = useFavoritesItems();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(favoriteProduct.length);

  const rawCount = favoriteProduct?.length || 0;

  const getDisplayCount = () => {
    return rawCount > 9 ? "9+" : rawCount;
  };

  useEffect(() => {
    if (rawCount !== prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(rawCount);
      return () => clearTimeout(timer);
    }
  }, [rawCount, prevCount]);

  const displayCount = getDisplayCount();
  const hasItems = rawCount > 0;

  return (
    <Link
      href="/favorites"
      className="group relative hover:text-gofarm-light-green hoverEffect"
    >
      <Heart
        className={`group-hover:text-gofarm-light-green hoverEffect transition-transform ${
          isAnimating ? "scale-125" : ""
        }`}
      />
      {hasItems && (
        <span
          className={`absolute -top-1 -right-1 bg-gofarm-green text-gofarm-white rounded-full text-xs font-semibold flex items-center justify-center min-w-3.5 h-3.5 transition-transform ${
            displayCount === "9+" ? "px-1" : "w-3.5"
          } ${isAnimating ? "scale-125" : ""}`}
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
};

export default FavoriteIcon;
