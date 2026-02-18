"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Plus,
  Minus,
  Heart,
  Shield,
  Truck,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import useStore, {
  useCartItems,
  useCartTotal,
  useCartCount,
  useRemoveFromCart,
  useUpdateCartQuantity,
  useClearCart,
  useAddToFavorite,
  useFavoritesItems,
} from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove,
  onMoveToWishlist,
  isFavorite,
}: {
  item: any;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  onMoveToWishlist: (item: any) => void;
  isFavorite: boolean;
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-6">
          <Link href={`/products/${item.slug || item.id}`}>
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <Link href={`/products/${item.slug || item.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                  {item.name}
                </h3>
              </Link>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                ${item.price.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoveToWishlist(item)}
                  className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.id)}
                  className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CartPage() {
  const cartItems = useCartItems();
  const cartTotal = useCartTotal();
  const cartCount = useCartCount();
  const removeFromCart = useRemoveFromCart();
  const updateQuantity = useUpdateCartQuantity();
  const clearCart = useClearCart();
  const addToFavorite = useAddToFavorite();
  const favorites = useFavoritesItems();

  const [isLoading, setIsLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const favoriteIds = useMemo(() => {
    return new Set(favorites.map((fav) => fav.id));
  }, [favorites]);

  const handleUpdateQuantity = useCallback(
    (productId: number, newQuantity: number) => {
      if (newQuantity < 1) return;
      updateQuantity(productId, newQuantity);
    },
    [updateQuantity],
  );

  const handleRemoveItem = useCallback(
    (productId: number) => {
      removeFromCart(productId);
    },
    [removeFromCart],
  );

  const handleMoveToWishlist = useCallback(
    (item: any) => {
      addToFavorite({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        slug: item.slug,
      });
      removeFromCart(item.id);
    },
    [addToFavorite, removeFromCart],
  );

  const handleApplyPromo = useCallback(() => {
    if (promoCode.toUpperCase() === "SAVE10") {
      setPromoApplied(true);
      setPromoDiscount(cartTotal * 0.1);
    } else if (promoCode.toUpperCase() === "SAVE20") {
      setPromoApplied(true);
      setPromoDiscount(cartTotal * 0.2);
    } else {
      alert("Invalid promo code");
    }
  }, [promoCode, cartTotal]);

  const handleCheckout = useCallback(() => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      window.location.href = "/checkout";
    }, 1500);
  }, []);

  const handleClearCart = useCallback(() => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
    }
  }, [clearCart]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const subtotal = cartTotal;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.1;
  const discount = promoApplied ? promoDiscount : 0;
  const total = subtotal + shipping + tax - discount;

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Looks like you haven't added anything to your cart yet. Browse our
            products and find something you'll love!
          </p>
          <Link href="/products">
            <Button size="lg" className="btn-primary">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-secondary-800">
            Shopping Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
          </h1>
        </div>

        <Button
          variant="ghost"
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              onMoveToWishlist={handleMoveToWishlist}
              isFavorite={favoriteIds.has(item.id)}
            />
          ))}
          <div className="mt-6">
            <Link href="/products">
              <Button
                variant="link"
                className="text-primary-600 dark:text-primary-400"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-1 bg-sky-800 text-white">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyPromo}
                    variant="outline"
                    disabled={promoApplied}
                  >
                    Apply
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-sm mt-2">
                    Promo code applied! You saved ${promoDiscount.toFixed(2)}
                  </p>
                )}
                <p className="text-xs mt-2">Try "SAVE10" or "SAVE20"</p>
              </div>

              <Separator className="my-4" />
              <div className="space-y-3 mb-6">
                <div className="flex justify-between ">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="font-medium">-${discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              <div className="flex justify-between mb-6">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full btn-primary mb-4"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Checkout
                  </>
                )}
              </Button>
              <div className="space-y-3 text-sm ">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping on orders over $100</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t ">
                <p className="text-xs text-center">
                  We accept all major credit cards, PayPal, and Apple Pay
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
