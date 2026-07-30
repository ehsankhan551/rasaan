import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");

  const { data: items } = await supabase
    .from("wishlist_items")
    .select(
      "product_id, products(id, name, price, image_url, stock_qty, shop_id, shops(name))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const products = (items ?? []).map((i: any) => i.products).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {products.length === 0 ? (
        <p className="text-gray-500">
          You haven&apos;t saved any products yet.{" "}
          <Link href="/products" className="text-green-700 hover:underline">
            Browse products
          </Link>
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p: any) => {
            const shop = Array.isArray(p.shops) ? p.shops[0] : p.shops;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 overflow-hidden flex flex-col"
              >
                <Link href={`/products/${p.id}`} className="block">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </div>
                </Link>
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <span className="text-xs text-gray-500">{shop?.name}</span>
                  <Link
                    href={`/products/${p.id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-auto flex items-center justify-between pt-2 gap-2">
                    <span className="font-bold text-gray-900">
                      Rs {Number(p.price).toFixed(0)}
                    </span>
                    <div className="flex items-center gap-2">
                      <WishlistButton productId={p.id} initialWishlisted={true} />
                      {p.stock_qty > 0 ? (
                        <AddToCartButton
                          productId={p.id}
                          name={p.name}
                          price={Number(p.price)}
                          shopId={p.shop_id}
                          shopName={shop?.name ?? ""}
                        />
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Out of stock</span>
                      )}
                    </div>
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
