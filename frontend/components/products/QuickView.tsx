"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Heart,
  Star,
  Package,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Product } from "@/lib/productApi";
import useStore, { useIsFavorite } from "@/store";
import { toast } from "sonner";

interface QuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickView({
  product,
  open,
  onOpenChange,
}: QuickViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToFavorite, removeFromFavorite } = useStore();
  const isFavorite = useIsFavorite(product.id);

  const images = product.images || [];
  const primaryImage = product.primary_image || images[0];
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getFullImageUrl = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${cleanUrl}`;
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price:
        typeof product.price === "string"
          ? parseFloat(product.price)
          : product.price,
      image: getFullImageUrl(primaryImage?.image_url) || undefined,
      slug: product.slug || undefined,
      quantity: quantity,
    });
    toast.success("Added to cart!", {
      description: `${quantity} × ${product.name} added to your cart`,
    });
    onOpenChange(false);
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorite(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToFavorite({
        id: product.id,
        name: product.name,
        price:
          typeof product.price === "string"
            ? parseFloat(product.price)
            : product.price,
        image: getFullImageUrl(primaryImage?.image_url) || undefined,
        slug: product.slug || undefined,
        category_name: product.category?.name || product.category?.name,
      });
      toast.success("Added to wishlist!");
    }
  };

  const nextImage = () => {
    if (selectedImage < images.length - 1) {
      setSelectedImage((prev) => prev + 1);
    }
  };

  const prevImage = () => {
    if (selectedImage > 0) {
      setSelectedImage((prev) => prev - 1);
    }
  };

  const price =
    typeof product.price === "string"
      ? parseFloat(product.price)
      : product.price;
  const inStock = product.quantity > 0 && product.status === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative bg-gray-50 dark:bg-gray-800 p-6">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-700 mb-4">
              {images.length > 0 ? (
                <img
                  src={getFullImageUrl(images[selectedImage]?.image_url) || ""}
                  alt={images[selectedImage]?.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={selectedImage === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={selectedImage === images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? "border-primary-600"
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={getFullImageUrl(image.image_url) || ""}
                      alt={image.alt_text || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-150">
            <DialogHeader className="px-0 pt-0">
              <div className="flex items-center gap-2 mb-2">
                {product.category?.name && (
                  <Badge
                    variant="secondary"
                    className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                  >
                    {product.category?.name}
                  </Badge>
                )}
                <Badge
                  variant={inStock ? "default" : "destructive"}
                  className={
                    inStock
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : ""
                  }
                >
                  {inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>

              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </DialogTitle>

              <DialogDescription className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-2">
                ${price.toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (product.average_rating || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({product.review_count || 0} reviews)
                </span>
              </div>
            )}

            <Separator className="my-4" />
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {product.description || "No description available."}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Quantity Available:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {product.quantity} units
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">SKU:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  PROD-{product.id.toString().padStart(6, "0")}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity:
                </span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((prev) =>
                        Math.min(product.quantity, prev + 1),
                      )
                    }
                    disabled={quantity >= product.quantity}
                    className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 btn-primary"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleToggleFavorite}
                  variant="outline"
                  className={isFavorite ? "text-red-600 border-red-600" : ""}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite ? "fill-red-600" : ""}`}
                  />
                </Button>
              </div>

              <Link
                href={`/products/${product.id}`}
                className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2"
                onClick={() => onOpenChange(false)}
              >
                View Full Details →
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
