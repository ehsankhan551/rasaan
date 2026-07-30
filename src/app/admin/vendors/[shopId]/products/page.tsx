import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addProduct } from "./actions";
import ProductRow from "./ProductRow";
import ImportExportBar from "./ImportExportBar";
import { getCategoriesForShopType, getDefaultCategoryForShopType } from "@/lib/categories";

export default async function AdminShopProductsPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/vendors");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, category")
    .eq("id", shopId)
    .maybeSingle();

  if (!shop) notFound();

  const categories = getCategoriesForShopType(shop.category);
  const defaultCategory = getDefaultCategoryForShopType(shop.category);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, stock_qty, active, image_url, category, generic_name")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  const addProductWithShop = addProduct.bind(null, shop.id);

  return (
    <div>
      <p className="text-sm mb-2">
        <Link href="/admin/vendors" className="text-green-700 font-medium">
          ← Vendors
        </Link>
      </p>
      <h1 className="text-2xl font-bold mb-6">{shop.name} — Products</h1>

      <ImportExportBar shopId={shop.id} products={products ?? []} />

      <form action={addProductWithShop} className="grid gap-3 sm:grid-cols-7 mb-8 items-end">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Name</label>
          <input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Price (Rs)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min={0}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Stock</label>
          <input
            name="stock_qty"
            type="number"
            min={0}
            defaultValue={0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Category</label>
          <select
            name="category"
            defaultValue={defaultCategory}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Generic Name</label>
          <input
            name="generic_name"
            placeholder="e.g. Paracetamol"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-lg bg-green-700 text-white px-4 py-2 text-sm font-semibold">
          Add product
        </button>
        <div className="sm:col-span-7">
          <label className="block text-xs font-medium mb-1">Description</label>
          <input name="description" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </form>

      {(!products || products.length === 0) ? (
        <p className="text-gray-500">No products yet — add the first one above.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Price</th>
              <th className="pb-2 font-medium">Stock</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow key={p.id} shopId={shop.id} product={p} categories={categories} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
