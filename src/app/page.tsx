import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import AddToCartButton from "@/components/AddToCartButton";
import NearbyShops from "@/components/NearbyShops";

const CATEGORY_ICONS: Record<string, string> = {
  "Groceries": "🛒",
  "Cosmetics & Beauty": "💄",
  "Medicine & Health": "💊",
  "Bakery & Sweets": "🍰",
  "Fruits & Vegetables": "🥦",
  "Electronics": "🔌",
  "Clothing & Fashion": "👕",
  "Home & Kitchen": "🏠",
  "Books & Stationery": "📚",
  "Mobile Accessories": "📱",
  "Other": "🛍️",
};

export default async function Home() {
  const supabase = await createClient();

  const { data: hotProducts } = await supabase
    .from("products")
    .select("id, name, price, image_url, category, shop_id, shops!inner(name)")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-r from-green-800 to-green-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Everything your neighborhood shops sell — delivered to your door
          </h1>
          <p className="text-green-100 max-w-xl mx-auto mb-6">
            Groceries, cosmetics, medicine, electronics and more from local shops near you. Cash
            on delivery or pay online.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/products"
              className="rounded-lg bg-white text-green-800 font-semibold px-5 py-2.5"
            >
              Shop All Products
            </Link>
            <Link
              href="/shops"
              className="rounded-lg border border-white/60 text-white font-semibold px-5 py-2.5"
            >
              Browse Shops
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-white/60 text-white font-semibold px-5 py-2.5"
            >
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-lg font-semibold mb-4">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PRODUCT_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/products?category=${encodeURIComponent(c)}`}
              className="rounded-xl border border-gray-200 p-4 text-center hover:border-green-400 hover:bg-green-50"
            >
              <span className="text-2xl">{CATEGORY_ICONS[c] ?? "🛍️"}</span>
              <p className="text-xs font-medium text-gray-700 mt-2">{c}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Shops Near You</h2>
        <NearbyShops />
      </section>

      {hotProducts && hotProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New &amp; Trending</h2>
            <Link href="/products" className="text-sm text-green-700 font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hotProducts.map((p: any) => {
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
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="font-bold text-gray-900">
                        Rs {Number(p.price).toFixed(0)}
                      </span>
                      <AddToCartButton
                        productId={p.id}
                        name={p.name}
                        price={Number(p.price)}
                        shopId={p.shop_id}
                        shopName={shop?.name ?? ""}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-1">For Customers</h3>
          <p className="text-sm text-gray-600">
            Browse shops, order what you need, and pay by cash on delivery or online.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-1">For Vendors</h3>
          <p className="text-sm text-gray-600">
            List your products, manage orders, and choose your own delivery or use platform
            riders.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-1">For Riders</h3>
          <p className="text-sm text-gray-600">
            Pick up available deliveries nearby and earn on your own schedule.
          </p>
        </div>
      </section>
    </main>
  );
}
