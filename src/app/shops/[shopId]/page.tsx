import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
    .select("category")
    .eq("shop_id", shopId)
    .eq("active", true);

  const categories = Array.from(
    new Set((allProducts ?? []).map((p) => p.category).filter(Boolean))
  ).sort();

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

      {(!products || products.length === 0) && (
        <p className="text-gray-500">No products found.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((p) => {
          const hasDeal = p.sale_price && Number(p.sale_price) < Number(p.price);
          const discountPct = hasDeal
            ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)
            : 0;
          return (
            <div key={p.id} className="rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <Link href={`/products/${p.id}`} className="block relative">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">No image</span>
                  )}
                </div>
                {hasDeal && (
                  <span className="absolute top-2 left-2 text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">
                    -{discountPct}%
                  </span>
                )}
              </Link>
              <div className="p-4 flex flex-col flex-1">
                <Link href={`/products/${p.id}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
                {p.generic_name && (
                  <span className="text-xs text-gray-400">Generic: {p.generic_name}</span>
                )}
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
