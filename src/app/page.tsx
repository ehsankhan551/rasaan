import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES, DEPARTMENTS } from "@/lib/categories";
import AddToCartButton from "@/components/AddToCartButton";
import NearbyShops from "@/components/NearbyShops";
import ProductImage from "@/components/ProductImage";
import HeroCarousel from "@/components/HeroCarousel";
import AnimatedStats from "@/components/AnimatedStats";
import DealCountdown from "@/components/DealCountdown";

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

const DEPARTMENT_ICONS: Record<string, string> = {
  Men: "👔",
  Women: "👗",
  Kids: "🧒",
  Baby: "🍼",
  Unisex: "🛍️",
};

const FEATURES = [
  { icon: "🚚", title: "Fast local delivery", desc: "Riders pick up from nearby shops" },
  { icon: "💵", title: "Cash on delivery", desc: "Or pay online — your choice" },
  { icon: "🏪", title: "Verified local shops", desc: "Real vendors from your area" },
  { icon: "💬", title: "Ask our assistant", desc: "Tap the chat bubble for help" },
];

type RawProduct = {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  deal_ends_at?: string | null;
  image_url: string | null;
  category: string | null;
  shop_id: string;
  shops: { name: string } | { name: string }[];
};

function getShop(p: RawProduct) {
  return Array.isArray(p.shops) ? p.shops[0] : p.shops;
}

// Spread results across as many distinct shops as possible so Hot Deals
// isn't dominated by whichever single shop happens to have the most
// discounted items.
function diversifyByShop<T extends { shop_id: string }>(items: T[], limit: number): T[] {
  const byShop = new Map<string, T[]>();
  for (const item of items) {
    const list = byShop.get(item.shop_id) ?? [];
    list.push(item);
    byShop.set(item.shop_id, list);
  }
  const shopGroups = Array.from(byShop.values());
  const result: T[] = [];
  let round = 0;
  while (result.length < limit && shopGroups.some((g) => g.length > round)) {
    for (const group of shopGroups) {
      if (group.length > round) result.push(group[round]);
      if (result.length >= limit) break;
    }
    round++;
  }
  return result;
}

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: hotProductsRaw },
    { data: rawDeals },
    { count: productCount },
    { count: shopCount },
    { count: deliveredCount },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, image_url, category, shop_id, shops!inner(name)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("products")
      .select("id, name, price, sale_price, deal_ends_at, image_url, category, shop_id, shops!inner(name)")
      .eq("active", true)
      .not("sale_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("shops")
      .select("id", { count: "exact", head: true })
      .eq("approved", true)
      .eq("active", true),
    supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "delivered"),
  ]);

  const dealCandidates = ((rawDeals ?? []) as unknown as RawProduct[]).filter(
    (p) =>
      p.sale_price &&
      Number(p.sale_price) < Number(p.price) &&
      (!p.deal_ends_at || new Date(p.deal_ends_at) > new Date())
  );
  const dealProducts = diversifyByShop(dealCandidates, 8);
  const hotProducts = diversifyByShop((hotProductsRaw ?? []) as unknown as RawProduct[], 8);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/10 blur-3xl" />
        <div className="relative">
          <HeroCarousel />
        </div>
      </section>

      <AnimatedStats
        productCount={productCount ?? 0}
        shopCount={shopCount ?? 0}
        categoryCount={PRODUCT_CATEGORIES.length}
        deliveredCount={deliveredCount ?? 0}
      />

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-2xl leading-none">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {dealProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-red-600">🔥 Hot Deals</span>
            </h2>
            <Link href="/deals" className="text-sm text-green-700 font-medium hover:underline">
              View all deals →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dealProducts.map((p) => {
              const shop = getShop(p);
              const discountPct = Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group rounded-2xl border border-gray-200 overflow-hidden block relative bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    <ProductImage
                      src={p.image_url}
                      category={p.category}
                      name={p.name}
                      imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="absolute top-2 left-2 text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5 shadow">
                    -{discountPct}%
                  </span>
                  <div className="p-4">
                    <span className="text-xs text-gray-500">{shop?.name}</span>
                    <p className="font-semibold text-gray-900 mt-0.5 line-clamp-1">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-bold text-red-600">Rs {Number(p.sale_price).toFixed(0)}</span>
                      <span className="text-xs text-gray-400 line-through">Rs {Number(p.price).toFixed(0)}</span>
                    </div>
                    <DealCountdown endsAt={p.deal_ends_at} className="mt-1 inline-block text-[10px] font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Shop by Department</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DEPARTMENTS.filter((d) => d !== "Unisex").map((d) => (
            <Link
              key={d}
              href={`/products?department=${encodeURIComponent(d)}`}
              className="group rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-lg hover:border-green-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-3xl group-hover:bg-green-100 transition-colors">
                {DEPARTMENT_ICONS[d] ?? "🛍️"}
              </span>
              <p className="text-sm font-semibold text-gray-700 mt-3">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PRODUCT_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/products?category=${encodeURIComponent(c)}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm hover:shadow-lg hover:border-green-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-green-50 text-2xl group-hover:bg-green-100 transition-colors">
                {CATEGORY_ICONS[c] ?? "🛍️"}
              </span>
              <p className="text-xs font-medium text-gray-700 mt-2.5">{c}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Shops Near You</h2>
        <NearbyShops />
      </section>

      {hotProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">New &amp; Trending</h2>
            <Link href="/products" className="text-sm text-green-700 font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hotProducts.map((p) => {
              const shop = getShop(p);
              return (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200"
                >
                  <Link href={`/products/${p.id}`} className="block">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      <ProductImage
                        src={p.image_url}
                        category={p.category}
                        name={p.name}
                        imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <div className="p-4 flex flex-col gap-1 flex-1">
                    <span className="text-xs text-gray-500">{shop?.name}</span>
                    <Link
                      href={`/products/${p.id}`}
                      className="font-semibold text-gray-900 hover:underline line-clamp-1"
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
    </div>
  );
}
