"use client";

import { useState, useEffect } from "react";
import { useProducts } from "../../app/contexts/ProductContext";
import { useAuth } from "../../app/contexts/AuthContext";
import {
  Edit,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Package,
  Tag,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import ProductForm from "./ProductForm";

interface ProductDetailProps {
  productId: number;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const {
    currentProduct,
    loading,
    error,
    fetchProduct,
    deleteProduct,
    clearCurrentProduct,
    clearError,
  } = useProducts();

  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
    return () => {
      clearCurrentProduct();
    };
  }, [productId, fetchProduct, clearCurrentProduct]);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteProduct(productId);
        window.location.href = "/products";
      } catch (error) {
        console.error("Error deleting product:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity} ${currentProduct?.name} to cart!`);
  };

  const incrementQuantity = () => {
    if (currentProduct && quantity < currentProduct.quantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  if (loading && !currentProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex justify-between items-center">
          <span>Error: {error}</span>
          <button
            onClick={clearError}
            className="text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          Go back to products
        </Link>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Product not found</p>
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          Go back to products
        </Link>
      </div>
    );
  }

  const price = parseFloat(currentProduct.price.toString());
  const isOutOfStock =
    currentProduct.quantity === 0 || currentProduct.status === "out_of_stock";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Products
        </Link>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Edit Product
          </h2>
          <ProductForm
            product={currentProduct}
            onSuccess={() => {
              setIsEditing(false);
              alert("Product updated successfully!");
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                {/* Placeholder image */}
                <div className="text-gray-400">
                  <svg
                    className="w-32 h-32"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded cursor-pointer hover:ring-2 hover:ring-blue-500"
                  ></div>
                ))}
              </div>
            </div>

            {(user?.role === "admin" || user?.role === "seller") && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Manage Product
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 size={18} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        currentProduct.status === "published"
                          ? "bg-green-100 text-green-800"
                          : currentProduct.status === "out_of_stock"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {currentProduct.status.replace("_", " ")}
                    </span>
                    {currentProduct.category && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {currentProduct.category.name}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentProduct.name}
                  </h1>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  ${price.toFixed(2)}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Description
                </h2>
                <p className="text-gray-600">
                  {currentProduct.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Package className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Quantity Available</p>
                    <p className="font-medium">
                      {currentProduct.quantity} units
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-medium">
                      PROD-{currentProduct.id.toString().padStart(6, "0")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {new Date(currentProduct.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Updated</p>
                    <p className="font-medium">
                      {new Date(currentProduct.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                {isOutOfStock ? (
                  <div className="text-center py-4">
                    <p className="text-red-600 font-medium mb-2">
                      Out of Stock
                    </p>
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                    >
                      Currently Unavailable
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">
                            {quantity}
                          </span>
                          <button
                            onClick={incrementQuantity}
                            disabled={quantity >= currentProduct.quantity}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(price * quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        <ShoppingCart size={20} />
                        Add to Cart
                      </button>
                      <button className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium">
                        Buy Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Additional Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Product ID</span>
                  <span className="font-medium">#{currentProduct.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium capitalize">
                    {currentProduct.status}
                  </span>
                </div>
                {currentProduct.slug && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Slug</span>
                    <span className="font-medium">{currentProduct.slug}</span>
                  </div>
                )}
                {currentProduct.category && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Category</span>
                    <Link
                      href={`/categories/${currentProduct.category.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {currentProduct.category.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
