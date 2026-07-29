import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ShopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { shopId } = await params;
  const { category } = await searchParams;
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
    .select("id, name, description, price, stock_qty, image_url, category")
    .eq("shop_id", shopId)
    .eq("active", true);

  if (category) productsQuery = productsQuery.eq("category", category);

  const { data: products } = await productsQuery.order("created_at", { ascending: false });

  const { data: allProducts } = await supabase
    .from("products")
    .select("category")
    .eq("shop_id", shopId)
    .eq("active", true);

  const categories = Array.from(
    new Set((allProducts ?? []).map((p) => p.category).filter(Boolean))
  ).sort();

  return (
    <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-10">
      <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">
        {shop.category}
      </span>
      <h1 className="text-2xl font-bold mt-1">{shop.name}</h1>
      <p className="text-gray-600 mt-1">{shop.description}</p>
      <p className="text-sm text-gray-400 mt-1">{shop.address}</p>

      <h2 className="text-lg font-semibold mt-8 mb-4">Products</h2>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/shops/${shop.id}`}
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
              href={`/shops/${shop.id}?category=${encodeURIComponent(c)}`}
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

      {(!products || products.length === 0) && (
        <p className="text-gray-500">This shop hasn&apos;t added any products yet.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-200 p-4 flex flex-col">
            <Link href={`/products/${p.id}`} className="font-semibold hover:underline">
              {p.name}
            </Link>
            <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 w-fit mt-1">
              {p.category}
            </span>
            <p className="text-sm text-gray-600 flex-1 mt-1">{p.description}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="font-semibold">Rs {p.price}</span>
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
        ))}
      </div>
    </main>
  );
}
