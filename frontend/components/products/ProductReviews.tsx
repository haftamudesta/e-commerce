"use client";

import { useState, useEffect } from "react";
import { useReviews } from "@/contexts/ReviewContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star,
  User,
  Clock,
  ThumbsUp,
  Flag,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductReviewsProps {
  productId: number;
  productName?: string;
  showTitle?: boolean;
  limit?: number;
  onReviewAdded?: () => void;
}

export default function ProductReviews({
  productId,
  productName,
  showTitle = true,
  limit = 10,
  onReviewAdded,
}: ProductReviewsProps) {
  const { user } = useAuth();
  const {
    reviews,
    stats,
    loading,
    error,
    fetchProductReviews,
    createReview,
    updateReview,
    deleteReview,
    hasUserReviewed,
    clearError,
  } = useReviews();
  console.log(reviews);
  console.log("user", user);

  const [newReview, setNewReview] = useState({ text: "", rating: 5 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(
    new Set(),
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProductReviews(productId, 0, limit);
    }
  }, [productId, limit, fetchProductReviews]);

  useEffect(() => {
    if (user && productId) {
      checkUserReview();
    }
  }, [user, productId, reviews]);

  const checkUserReview = async () => {
    if (user) {
      const reviewed = await hasUserReviewed(productId, Number(user.id));
      setUserHasReviewed(reviewed);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLocalError("Please login to write a review");
      return;
    }

    if (newReview.text.length < 5) {
      setLocalError("Review must be at least 5 characters long");
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      await createReview({
        text: newReview.text,
        rating: newReview.rating,
        product_id: productId,
      });

      setNewReview({ text: "", rating: 5 });
      setShowForm(false);
      setSuccessMessage("Review posted successfully!");
      onReviewAdded?.();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setLocalError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId: number) => {
    if (editText.length < 5) {
      setLocalError("Review must be at least 5 characters long");
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      await updateReview(reviewId, {
        text: editText,
        rating: editRating,
      });

      setEditingId(null);
      setSuccessMessage("Review updated successfully!");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setLocalError(err.message || "Failed to update review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setSubmitting(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      await deleteReview(reviewId);
      setSuccessMessage("Review deleted successfully!");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setLocalError(err.message || "Failed to delete review");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReviewExpand = (reviewId: number) => {
    const newExpanded = new Set(expandedReviews);
    if (expandedReviews.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const canModify = (reviewUserId: number) => {
    return user && (Number(user.id) === reviewUserId || user.role === "admin");
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onChange?: (rating: number) => void,
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange?.(star)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform focus:outline-none`}
            disabled={!interactive || submitting}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <div key={`rating-${rating}`} className="flex items-center gap-2 text-sm">
        <span className="w-12 text-gray-600">{rating} stars</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-12 text-gray-600">{count}</span>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {user && !userHasReviewed && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {(error || localError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error || localError}</p>
          <button
            onClick={() => {
              clearError?.();
              setLocalError(null);
            }}
            className="ml-auto text-red-500 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}
      {stats && stats.total_reviews > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center md:border-r border-gray-200">
              <div className="text-5xl font-bold text-gray-900">
                {stats.average_rating}
              </div>
              <div className="mt-2 flex justify-center">
                {renderStars(Math.round(stats.average_rating))}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {stats.total_reviews}{" "}
                {stats.total_reviews === 1 ? "review" : "reviews"}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) =>
                renderRatingBar(
                  rating,
                  stats.rating_counts[
                    rating as keyof typeof stats.rating_counts
                  ],
                  stats.total_reviews,
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && user && !userHasReviewed && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Write a Review for {productName}
          </h3>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              {renderStars(newReview.rating, true, (rating) =>
                setNewReview((prev) => ({ ...prev, rating })),
              )}
            </div>

            <div>
              <label
                htmlFor="review"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Review
              </label>
              <textarea
                id="review"
                rows={4}
                value={newReview.text}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="Share your experience with this product... What did you like or dislike?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={submitting}
                maxLength={2000}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{newReview.text.length} / 2000 characters</span>
                {newReview.text.length < 5 && (
                  <span className="text-amber-600">
                    Minimum 5 characters required
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || newReview.text.length < 5}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const isLongReview = review.text.length > 300;
            const displayText =
              isExpanded || !isLongReview
                ? review.text
                : review.text.slice(0, 300) + "...";

            return (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                {editingId === review.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      {renderStars(editRating, true, setEditRating)}
                    </div>

                    <div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={submitting}
                        maxLength={2000}
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        {editText.length} / 2000 characters
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateReview(review.id)}
                        disabled={submitting || editText.length < 5}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {submitting ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user?.username || `User ${review.user_id}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(
                                new Date(review.created_at),
                                { addSuffix: true },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canModify(review.user_id) && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingId(review.id);
                              setEditText(review.text);
                              setEditRating(review.rating);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit review"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={submitting}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {displayText}
                      </p>

                      {isLongReview && (
                        <button
                          onClick={() => toggleReviewExpand(review.id)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Show less <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-4 pt-4 border-t border-gray-100">
                      <button
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={() => {
                          /*To Be Implement  */
                        }}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Helpful
                      </button>
                      <button
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                        onClick={() => {
                          /*To Be Implement  */
                        }}
                      >
                        <Flag className="w-4 h-4" />
                        Report
                      </button>

                      {review.updated_at &&
                        review.updated_at !== review.created_at && (
                          <span className="text-xs text-gray-400 ml-auto">
                            (edited{" "}
                            {formatDistanceToNow(new Date(review.updated_at), {
                              addSuffix: true,
                            })}
                            )
                          </span>
                        )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {reviews.length >= limit && (
            <div className="text-center pt-4">
              <button
                onClick={() =>
                  fetchProductReviews(productId, reviews.length, limit)
                }
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No reviews yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {user
              ? "Be the first to share your experience with this product!"
              : "Be the first to review this product!"}
          </p>
          {user && !userHasReviewed && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              Write a Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
