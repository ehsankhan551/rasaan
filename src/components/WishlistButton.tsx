"use client";

import { useState, useTransition } from "react";
import { toggleWishlist } from "@/app/wishlist/actions";

export default function WishlistButton({
  productId,
  initialWishlisted,
}: {
  productId: string;
  initialWishlisted: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !wishlisted;
    setWishlisted(next);
    startTransition(async () => {
      const res = await toggleWishlist(productId);
      if (res.error) {
        setWishlisted(!next);
        window.location.href = `/login?next=/products/${productId}`;
        return;
      }
      setWishlisted(res.wishlisted);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full border shrink-0 transition-colors ${
        wishlisted
          ? "border-red-300 bg-red-50 text-red-500"
          : "border-gray-300 bg-white text-gray-400 hover:text-red-500 hover:border-red-300"
      }`}
    >
      <span className="text-lg leading-none">{wishlisted ? "♥" : "♡"}</span>
    </button>
  );
}
