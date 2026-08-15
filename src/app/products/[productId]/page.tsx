import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ReviewForm from "./ReviewForm";
import QAForm from "./QAForm";
import AnswerForm from "./AnswerForm";
import ProductImage from "@/components/ProductImage";
import DealCountdown from "@/components/DealCountdown";

function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={`${size} text-yellow-400 tracking-tight`}>
      {"★".repeat(rounded)}
      <span className="text-gray-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price, sale_price, deal_ends_at, stock_qty, image_url, category, shop_id, shops!inner(id, name, address, vendor_id)"
    )
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle();

  if (!product) notFound();

  const shop: any = Array.isArray(product.shops) ? product.shops[0] : product.shops;

  const dealExpired =
    product.deal_ends_at != null && new Date(product.deal_ends_at) <= new Date();
  const hasDeal =
    product.sale_price && Number(product.sale_price) < Number(product.price) && !dealExpired;
  const discountPct = hasDeal
    ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)
    : 0;

  const { data: related } = await supabase
    .from("products")
    .select("id, name, price, sale_price, image_url, shop_id, shops!inner(name)")
    .eq("category", product.category)
    .eq("active", true)
    .neq("id", product.id)
    .limit(4);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const reviewCount = reviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? (reviews as any[]).reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const { data: questions } = await supabase
    .from("product_questions")
    .select("id, question, answer, answered_at, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlisted = false;
  let canAnswer = false;
  if (user) {
    const { data: w } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    wishlisted = !!w;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    canAnswer = profile?.role === "admin" || user.id === shop?.vendor_id;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/products" className="text-sm text-gray-500 hover:underline">
        ← Browse Products
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center relative">
          <ProductImage src={product.image_url} category={product.category} name={product.name} />
          {hasDeal && (
            <span className="absolute top-3 left-3 text-xs font-bold bg-red-600 text-white rounded-full px-2.5 py-1">
              -{discountPct}% OFF
            </span>
          )}
        </div>
        <div>
          <Link href={`/shops/${shop?.id}`} className="text-sm text-gray-500 hover:underline">
            {shop?.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          <span className="inline-block mt-2 text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-1">
            {product.category}
          </span>

          {reviewCount > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <Stars value={avgRating} />
              <span className="text-sm text-gray-600">
                {avgRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">No reviews yet</p>
          )}

          {hasDeal ? (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-red-600">
                  Rs {Number(product.sale_price).toFixed(0)}
                </p>
                <p className="text-base text-gray-400 line-through">
                  Rs {Number(product.price).toFixed(0)}
                </p>
              </div>
              <DealCountdown endsAt={product.deal_ends_at} className="mt-1 inline-block text-xs font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-1" />
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-4">
              Rs {Number(product.price).toFixed(0)}
            </p>
          )}
          {product.description && (
            <p className="text-gray-600 mt-3 whitespace-pre-line">{product.description}</p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <div>
              {product.stock_qty > 0 ? (
                <>
                  <p className="text-sm text-green-600 mb-2">
                    In stock ({product.stock_qty} available)
                  </p>
                  <AddToCartButton
                    productId={product.id}
                    name={product.name}
                    price={Number(hasDeal ? product.sale_price : product.price)}
                    shopId={product.shop_id}
                    shopName={shop?.name ?? ""}
                  />
                </>
              ) : (
                <p className="text-sm text-red-500 font-medium">Out of stock</p>
              )}
            </div>
            <WishlistButton productId={product.id} initialWishlisted={wishlisted} />
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold mb-4">
          Reviews {reviewCount > 0 && `(${reviewCount})`}
        </h2>

        {user ? (
          <ReviewForm productId={product.id} />
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            <Link href={`/login?next=/products/${product.id}`} className="text-green-700 hover:underline">
              Log in
            </Link>{" "}
            to leave a review.
          </p>
        )}

        {reviewCount > 0 ? (
          <div className="mt-6 space-y-4">
            {(reviews as any[]).map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-gray-700 mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-4">Be the first to review this product.</p>
        )}
      </div>

      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold mb-4">
          Questions &amp; Answers {questions && questions.length > 0 && `(${questions.length})`}
        </h2>

        {user ? (
          <QAForm productId={product.id} />
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            <Link href={`/login?next=/products/${product.id}`} className="text-green-700 hover:underline">
              Log in
            </Link>{" "}
            to ask a question.
          </p>
        )}

        {questions && questions.length > 0 ? (
          <div className="mt-6 space-y-4">
            {(questions as any[]).map((q) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900">Q: {q.question}</p>
                {q.answer ? (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-semibold text-green-700">A:</span> {q.answer}
                  </p>
                ) : canAnswer ? (
                  <AnswerForm questionId={q.id} productId={product.id} />
                ) : (
                  <p className="text-xs text-gray-400 mt-2">Awaiting seller reply.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-4">No questions yet. Be the first to ask.</p>
        )}
      </div>

      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Related Products</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p: any) => {
              const relDeal = p.sale_price && Number(p.sale_price) < Number(p.price);
              const s = Array.isArray(p.shops) ? p.shops[0] : p.shops;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="rounded-xl border border-gray-200 overflow-hidden block relative"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <ProductImage src={p.image_url} category={p.category} name={p.name} />
                  </div>
                  {relDeal && (
                    <span className="absolute top-2 left-2 text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">
                      -{Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)}%
                    </span>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-gray-500">{s?.name}</p>
                    <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    {relDeal ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-bold text-sm text-red-600">Rs {Number(p.sale_price).toFixed(0)}</span>
                        <span className="text-xs text-gray-400 line-through">Rs {Number(p.price).toFixed(0)}</span>
                      </div>
                    ) : (
                      <p className="font-bold text-sm text-gray-900 mt-1">
                        Rs {Number(p.price).toFixed(0)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
