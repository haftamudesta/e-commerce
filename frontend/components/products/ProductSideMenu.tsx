"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/lib/productApi";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import useStore from "@/store";

interface ProductSidemenuProps {
  product: Product;
  className?: string;
  onCompare?: () => void;
  onShare?: () => void;
}

const ProductSidemenu = ({
  product,
  className,
  onCompare,
  onShare,
}: ProductSidemenuProps) => {
  const { favoriteProduct, addToFavorite, removeFromFavorite } = useStore();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const exists = favoriteProduct.some((item) => item?.id === product?.id);
    setIsFavorite(exists);
  }, [product, favoriteProduct]);

  const handleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product?.id) return;

    try {
      if (isFavorite) {
        removeFromFavorite(product.id);
        toast.success("Removed from wishlist", {
          description: "Product removed successfully!",
          duration: 3000,
        });
      } else {
        addToFavorite({
          id: product.id,
          name: product.name,
          price:
            typeof product.price === "string"
              ? parseFloat(product.price)
              : product.price,
          image:
            product.images?.[0]?.image_url || product.primary_image?.image_url,
          slug: product.slug || undefined,
          category_name: product.category?.name,
        });
        toast.success("Added to wishlist", {
          description: "Product added successfully!",
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleCompare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompare) {
      onCompare();
    } else {
      toast.info("Compare feature coming soon!", {
        duration: 3000,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onShare) {
      onShare();
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text:
            product.description || `Check out this product: ${product.name}`,
          url: `${window.location.origin}/products/${product.slug || product.id}`,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/products/${product.slug || product.id}`,
      );
      toast.success("Link copied!", {
        description: "Product link copied to clipboard",
        duration: 3000,
      });
    }
  };

  return (
    <div
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 translate-x-full group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out z-10",
        className,
      )}
    >
      <button
        onClick={handleFavorite}
        className={`p-2 rounded-full shadow-lg border border-primary-600/20 backdrop-blur-sm hover:scale-110 transition-all duration-300 ${
          isFavorite
            ? "bg-primary-600 text-white"
            : "bg-white/90 text-gray-700 hover:bg-primary-600 hover:text-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-primary-600"
        }`}
        title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={16} className={isFavorite ? "fill-current" : ""} />
      </button>

      <button
        onClick={handleCompare}
        className="p-2 rounded-full shadow-lg border border-primary-600/20 backdrop-blur-sm hover:scale-110 transition-all duration-300 bg-white/90 text-gray-700 hover:bg-primary-600 hover:text-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-primary-600"
        title="Compare product"
      >
        <ArrowLeftRight size={16} />
      </button>
      <button
        onClick={handleShare}
        className="p-2 rounded-full shadow-lg border border-primary-600/20 backdrop-blur-sm hover:scale-110 transition-all duration-300 bg-white/90 text-gray-700 hover:bg-primary-600 hover:text-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-primary-600"
        title="Share product"
      >
        <Share2 size={16} />
      </button>
    </div>
  );
};

export default ProductSidemenu;
