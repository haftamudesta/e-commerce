"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Product } from "@/lib/productApi";
import { cn } from "@/lib/utils";
import { Heart, Share2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import useStore from "@/store";
import QuickView from "./QuickView";

interface ProductSidemenuProps {
  product: Product;
  className?: string;
}

const ProductSidemenu = ({ product, className }: ProductSidemenuProps) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { favoriteProduct, addToFavorite, removeFromFavorite } = useStore();

  const isFavorite = useMemo(() => {
    return favoriteProduct.some((item) => item?.id === product?.id);
  }, [favoriteProduct, product?.id]);

  const handleFavorite = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
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
              product.images?.[0]?.image_url ||
              product.primary_image?.image_url,
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
        });
      }
    },
    [product, isFavorite, addToFavorite, removeFromFavorite],
  );

  const handleQuickView = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setQuickViewOpen(true);
    },
    [],
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const url = `${window.location.origin}/users/products/${product.id}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: product.name,
            text:
              product.description || `Check out this product: ${product.name}`,
            url,
          });
        } catch (error) {}
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!", {
          description: "Product link copied to clipboard",
          duration: 3000,
        });
      }
    },
    [product],
  );

  return (
    <>
      <TooltipProvider>
        <div
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 translate-x-full group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out z-10",
            className,
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleQuickView}
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-primary-600 hover:text-white dark:bg-gray-800/90 dark:hover:bg-primary-600 transition-all duration-300 hover:scale-110"
              >
                <Eye size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-accent-400 text-xl font-bold">Quick view</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleFavorite}
                size="icon"
                variant="secondary"
                className={`h-9 w-9 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                  isFavorite
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-white/90 text-gray-700 hover:bg-primary-600 hover:text-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-primary-600"
                }`}
              >
                <Heart size={16} className={isFavorite ? "fill-current" : ""} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-accent-400 text-xl font-bold">
                {isFavorite ? "Remove from wishlist" : "Add to wishlist"}
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleShare}
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-primary-600 hover:text-white dark:bg-gray-800/90 dark:hover:bg-primary-600 transition-all duration-300 hover:scale-110"
              >
                <Share2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-accent-400 text-xl font-bold">Share product</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      <QuickView
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  );
};

export default ProductSidemenu;
