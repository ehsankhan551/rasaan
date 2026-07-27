import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addProduct } from "./actions";
import ProductRow from "./ProductRow";

export default async function VendorProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/products");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, approved")
    .eq("vendor_id", user.id)
    .maybeSingle();

  if (!shop) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        <p className="text-gray-500">Create your shop profile first before adding products.</p>
      </div>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, stock_qty, active")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <form action={addProduct} className="grid gap-3 sm:grid-cols-5 mb-8 items-end">
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
        <button className="rounded-lg bg-green-700 text-white px-4 py-2 text-sm font-semibold">
          Add product
        </button>
        <div className="sm:col-span-5">
          <label className="block text-xs font-medium mb-1">Description</label>
          <input name="description" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </form>

      {(!products || products.length === 0) ? (
        <p className="text-gray-500">No products yet — add your first one above.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Price</th>
              <th className="pb-2 font-medium">Stock</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
