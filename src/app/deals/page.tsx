import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ProductImage from "@/components/ProductImage";
import DealCountdown from "@/components/DealCountdown";

export default async function DealsPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("products")
    .select(
      "id, name, price, sale_price, deal_ends_at, stock_qty, image_url, category, shop_id, shops!inner(name)"
    )
    .eq("active", true)
    .not("sale_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const products = (raw ?? []).filter(
    (p: any) =>
      p.sale_price &&
      Number(p.sale_price) < Number(p.price) &&
      (!p.deal_ends_at || new Date(p.deal_ends_at) > new Date())
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlistedIds = new Set<string>();
  if (user) {
    const { data: w } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);
    wishlistedIds = new Set((w ?? []).map((x: any) => x.product_id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-1 text-red-600">🔥 Hot Deals</h1>
      <p className="text-gray-500 mb-6">
        {products.length} product{products.length === 1 ? "" : "s"} on sale right now
      </p>

      {products.length === 0 ? (
        <p className="text-gray-500">No deals right now — check back soon.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p: any) => {
            const shop = Array.isArray(p.shops) ? p.shops[0] : p.shops;
            const discountPct = Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 overflow-hidden flex flex-col"
              >
                <Link href={`/products/${p.id}`} className="block relative">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <ProductImage src={p.image_url} category={p.category} name={p.name} />
                  </div>
                  <span className="absolute top-2 left-2 text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">
                    -{discountPct}%
                  </span>
                </Link>
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">{shop?.name}</span>
                    <WishlistButton
                      productId={p.id}
                      initialWishlisted={wishlistedIds.has(p.id)}
                    />
                  </div>
                  <Link
                    href={`/products/${p.id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 w-fit">
                    {p.category}
                  </span>
                  <DealCountdown endsAt={p.deal_ends_at} />
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-red-600">Rs {Number(p.sale_price).toFixed(0)}</span>
                      <span className="text-xs text-gray-400 line-through">Rs {Number(p.price).toFixed(0)}</span>
                    </div>
                    {p.stock_qty > 0 ? (
                      <AddToCartButton
                        productId={p.id}
                        name={p.name}
                        price={Number(p.sale_price)}
                        shopId={p.shop_id}
                        shopName={shop?.name ?? ""}
                      />
                    ) : (
                      <span className="text-xs text-red-500 font-medium">Out of stock</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
