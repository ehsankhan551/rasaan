import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import AddToCartButton from "@/components/AddToCartButton";

type SearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const category = sp.category || "";
  const minPrice = sp.minPrice ? Number(sp.minPrice) : null;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : null;
  const inStock = sp.inStock === "1";
  const sort = sp.sort || "newest";

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "id, name, description, price, stock_qty, image_url, category, shop_id, shops!inner(id, name)"
    )
    .eq("active", true);

  if (q) query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("category", category);
  if (minPrice !== null && !Number.isNaN(minPrice)) query = query.gte("price", minPrice);
  if (maxPrice !== null && !Number.isNaN(maxPrice)) query = query.lte("price", maxPrice);
  if (inStock) query = query.gt("stock_qty", 0);

  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: products } = await query.limit(60);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Browse Products</h1>

      <form
        method="get"
        className="mb-8 grid gap-3 sm:grid-cols-6 items-end bg-gray-50 border border-gray-200 rounded-xl p-4"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            name="category"
            defaultValue={category}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
          <input
            type="number"
            name="minPrice"
            min="0"
            defaultValue={sp.minPrice || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
          <input
            type="number"
            name="maxPrice"
            min="0"
            defaultValue={sp.maxPrice || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sort</label>
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="inStock"
            name="inStock"
            value="1"
            defaultChecked={inStock}
            className="h-4 w-4"
          />
          <label htmlFor="inStock" className="text-sm text-gray-700">
            In stock only
          </label>
        </div>
        <div className="sm:col-span-6 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold"
          >
            Apply Filters
          </button>
          <Link
            href="/products"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Clear
          </Link>
        </div>
      </form>

      {!products || products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
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
                  <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 w-fit">
                    {p.category}
                  </span>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-bold text-gray-900">Rs {Number(p.price).toFixed(0)}</span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
