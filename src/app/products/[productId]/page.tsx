import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price, stock_qty, image_url, category, shop_id, shops!inner(id, name, address)"
    )
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle();

  if (!product) notFound();

  const shop: any = Array.isArray(product.shops) ? product.shops[0] : product.shops;

  const { data: related } = await supabase
    .from("products")
    .select("id, name, price, image_url, shop_id, shops!inner(name)")
    .eq("category", product.category)
    .eq("active", true)
    .neq("id", product.id)
    .limit(4);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/products" className="text-sm text-gray-500 hover:underline">
        ← Browse Products
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400">No image</span>
          )}
        </div>
        <div>
          <Link href={`/shops/${shop?.id}`} className="text-sm text-gray-500 hover:underline">
            {shop?.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          <span className="inline-block mt-2 text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-1">
            {product.category}
          </span>
          <p className="text-2xl font-bold text-gray-900 mt-4">
            Rs {Number(product.price).toFixed(0)}
          </p>
          {product.description && (
            <p className="text-gray-600 mt-3 whitespace-pre-line">{product.description}</p>
          )}
          <div className="mt-6">
            {product.stock_qty > 0 ? (
              <>
                <p className="text-sm text-green-600 mb-2">
                  In stock ({product.stock_qty} available)
                </p>
                <AddToCartButton
                  productId={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  shopId={product.shop_id}
                  shopName={shop?.name ?? ""}
                />
              </>
            ) : (
              <p className="text-sm text-red-500 font-medium">Out of stock</p>
            )}
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Related Products</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p: any) => {
              const s = Array.isArray(p.shops) ? p.shops[0] : p.shops;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="rounded-xl border border-gray-200 overflow-hidden block"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500">{s?.name}</p>
                    <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    <p className="font-bold text-sm text-gray-900 mt-1">
                      Rs {Number(p.price).toFixed(0)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
