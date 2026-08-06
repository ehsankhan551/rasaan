import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ProductImage from "@/components/ProductImage";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Nahdi-style circular icons for pharmacy categories. Falls back to a plain
// tag emoji for anything not in this list (e.g. "Other", or categories from
// non-pharmacy shops that happen to reuse this page).
const CATEGORY_ICONS: Record<string, string> = {
  "Pain Relief & Fever": "💊",
  "Antibiotics": "🧪",
  "Cough, Cold & Flu": "🤧",
  "Allergy": "🌸",
  "Digestive Health & Antacids": "🍽️",
  "Vitamins & Supplements": "🍊",
  "Diabetes Care": "🩸",
  "Cardiac & Blood Pressure": "❤️",
  "Skin Care & Dermatology": "🧴",
  "Eye & Ear Care": "👁️",
  "Women's Health": "🌷",
  "Baby & Mother Care": "🍼",
  "First Aid & Wound Care": "🩹",
  "Respiratory & Asthma": "🫁",
  "Neuro & Mental Health": "🧠",
  "Herbal & Homeopathic": "🌿",
  "Medical Devices & Equipment": "🩺",
  "Personal Care & Hygiene": "🧼",
};

// Categories where a "Prescription Required" style badge makes sense. Purely
// cosmetic/informational — not tied to a DB column, so it can't block or
// gate checkout by itself.
const RX_CATEGORIES = new Set([
  "Antibiotics",
  "Cardiac & Blood Pressure",
  "Diabetes Care",
  "Respiratory & Asthma",
  "Neuro & Mental Health",
]);

export default async function ShopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ category?: string; q?: string; letter?: string }>;
}) {
  const { shopId } = await params;
  const { category, q, letter } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, description, category, address, phone")
    .eq("id", shopId)
    .eq("approved", true)
    .eq("active", true)
    .single();

  if (!shop) notFound();

  const isPharmacy = (shop.category || "").toLowerCase() === "pharmacy";

  let productsQuery = supabase
    .from("products")
    .select("id, name, description, price, sale_price, stock_qty, image_url, category, generic_name")
    .eq("shop_id", shopId)
    .eq("active", true);

  if (category) productsQuery = productsQuery.eq("category", category);
  if (q) productsQuery = productsQuery.or(`name.ilike.%${q}%,generic_name.ilike.%${q}%`);
  if (letter) productsQuery = productsQuery.ilike("name", `${letter}%`);

  const { data: products } = await productsQuery.order("name", { ascending: true });

  const { data: allProducts } = await supabase
    .from("products")
    .select("category, sale_price, price")
    .eq("shop_id", shopId)
    .eq("active", true);

  const categories = Array.from(
    new Set((allProducts ?? []).map((p) => p.category).filter(Boolean))
  ).sort();

  const dealCount = (allProducts ?? []).filter(
    (p) => p.sale_price && Number(p.sale_price) < Number(p.price)
  ).length;
  const maxDiscountPct = (allProducts ?? []).reduce((max, p) => {
    if (!p.sale_price || Number(p.sale_price) >= Number(p.price)) return max;
    const pct = Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
    return Math.max(max, pct);
  }, 0);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlistedIds = new Set<string>();
  if (user) {
    const { data: w } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);
    wishlistedIds = new Set((w ?? []).map((row) => row.product_id));
  }

  function buildHref(overrides: { category?: string | null; q?: string | null; letter?: string | null }) {
    const params = new URLSearchParams();
    const nextCategory = overrides.category !== undefined ? overrides.category : category;
    const nextQ = overrides.q !== undefined ? overrides.q : q;
    const nextLetter = overrides.letter !== undefined ? overrides.letter : letter;
    if (nextCategory) params.set("category", nextCategory);
    if (nextQ) params.set("q", nextQ);
    if (nextLetter) params.set("letter", nextLetter);
    const qs = params.toString();
    return `/shops/${shopId}${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-10">
      {isPharmacy ? (
        <>
          {/* Nahdi-style hero banner */}
          <div className="rounded-2xl bg-gradient-to-r from-green-700 to-teal-600 text-white px-6 py-8 sm:px-10 sm:py-10 mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-white/15 rounded-full px-3 py-1 mb-3">
                Pharmacy
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold">{shop.name}</h1>
              <p className="text-white/85 mt-1 max-w-xl text-sm sm:text-base">{shop.description}</p>
              {maxDiscountPct > 0 && (
                <p className="mt-4 inline-block bg-white text-green-700 font-bold text-sm rounded-lg px-4 py-2">
                  Discounts up to {maxDiscountPct}% off &middot; {dealCount} deals live now
                </p>
              )}
              <p className="text-white/70 text-xs mt-3">{shop.address}</p>
            </div>
          </div>

          {/* Search */}
          <form className="mb-6 max-w-md" action={`/shops/${shopId}`} method="get">
            {category && <input type="hidden" name="category" value={category} />}
            {letter && <input type="hidden" name="letter" value={letter} />}
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search medicine by brand or generic name..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm"
            />
          </form>

          {/* Circular category carousel */}
          {categories.length > 1 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Shop by Category</h2>
              <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <Link
                  href={buildHref({ category: null })}
                  className="flex flex-col items-center gap-2 shrink-0 w-20"
                >
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full border text-2xl ${
                      !category
                        ? "border-green-700 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    🏥
                  </span>
                  <span className="text-[11px] text-center text-gray-700 leading-tight">All</span>
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={buildHref({ category: c })}
                    className="flex flex-col items-center gap-2 shrink-0 w-20"
                  >
                    <span
                      className={`flex h-16 w-16 items-center justify-center rounded-full border text-2xl ${
                        category === c
                          ? "border-green-700 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {CATEGORY_ICONS[c] || "🏷️"}
                    </span>
                    <span className="text-[11px] text-center text-gray-700 leading-tight">{c}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-6">
            {ALPHABET.map((l) => (
              <Link
                key={l}
                href={buildHref({ letter: letter === l ? null : l })}
                className={`text-xs rounded px-2 py-1 border ${
                  letter === l ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">
            {shop.category}
          </span>
          <h1 className="text-2xl font-bold mt-1">{shop.name}</h1>
          <p className="text-gray-600 mt-1">{shop.description}</p>
          <p className="text-sm text-gray-400 mt-1">{shop.address}</p>

          <h2 className="text-lg font-semibold mt-8 mb-4">Products</h2>

          <form className="mb-4 max-w-sm" action={`/shops/${shopId}`} method="get">
            {category && <input type="hidden" name="category" value={category} />}
            {letter && <input type="hidden" name="letter" value={letter} />}
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by brand or generic name..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </form>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Link
                href={buildHref({ category: null })}
                className={`text-xs rounded-full px-3 py-1.5 border ${
                  !category
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={buildHref({ category: c })}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    category === c
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-6">
            <Link
              href={buildHref({ letter: null })}
              className={`text-xs rounded px-2 py-1 border ${
                !letter ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600"
              }`}
            >
              All
            </Link>
            {ALPHABET.map((l) => (
              <Link
                key={l}
                href={buildHref({ letter: l })}
                className={`text-xs rounded px-2 py-1 border ${
                  letter === l ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </>
      )}

      {(!products || products.length === 0) && (
        <p className="text-gray-500">No products found.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((p) => {
          const hasDeal = p.sale_price && Number(p.sale_price) < Number(p.price);
          const discountPct = hasDeal
            ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)
            : 0;
          const showRx = isPharmacy && !hasDeal && RX_CATEGORIES.has(p.category);
          return (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 overflow-hidden flex flex-col bg-white hover:shadow-md transition-shadow"
            >
              <Link href={`/products/${p.id}`} className="block relative">
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                  <ProductImage src={p.image_url} category={p.category} name={p.name} />
                </div>
                {hasDeal && (
                  <span className="absolute top-2 left-2 text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">
                    -{discountPct}%
                  </span>
                )}
                {showRx && (
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-amber-500 text-white rounded-md px-2 py-0.5">
                    Prescription
                  </span>
                )}
              </Link>
              <div className="p-4 flex flex-col flex-1">
                {p.generic_name && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {p.generic_name}
                  </span>
                )}
                <Link href={`/products/${p.id}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
                <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 w-fit mt-1">
                  {p.category}
                </span>
                <p className="text-sm text-gray-600 flex-1 mt-1">{p.description}</p>
                <div className="flex items-center justify-between mt-3 gap-2">
                  {hasDeal ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-red-600">Rs {Number(p.sale_price).toFixed(0)}</span>
                      <span className="text-xs text-gray-400 line-through">Rs {Number(p.price).toFixed(0)}</span>
                    </div>
                  ) : (
                    <span className="font-semibold">Rs {p.price}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <WishlistButton productId={p.id} initialWishlisted={wishlistedIds.has(p.id)} />
                    {p.stock_qty > 0 ? (
                      <AddToCartButton
                        productId={p.id}
                        name={p.name}
                        price={Number(p.price)}
                        shopId={shop.id}
                        shopName={shop.name}
                      />
                    ) : (
                      <span className="text-xs text-red-500">Out of stock</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
