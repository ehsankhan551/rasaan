"use client";

import { useState, useTransition } from "react";
import { submitReview } from "./actions";

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await submitReview(productId, rating, comment);
      if (res?.error) {
        setError(res.error);
      } else {
        setDone(true);
        setComment("");
      }
    });
  }

  if (done) {
    return (
      <p className="text-sm text-green-600 mb-4 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
        Thanks for your review!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-2">Write a review</p>
      <div className="flex gap-1 mb-3" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            className={`text-2xl leading-none ${
              n <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-300"
            }`}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product..."
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
