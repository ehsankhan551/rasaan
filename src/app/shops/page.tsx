import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ShopsPage() {
  const supabase = await createClient();
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, description, category, address")
    .eq("approved", true)
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Browse Shops</h1>

      {(!shops || shops.length === 0) && (
        <p className="text-gray-500">
          No shops are live yet. Check back soon, or{" "}
          <Link href="/signup" className="text-green-700 font-medium">
            sign up as a vendor
          </Link>{" "}
          to list yours.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops?.map((shop) => (
          <Link
            key={shop.id}
            href={`/shops/${shop.id}`}
            className="rounded-xl border border-gray-200 p-5 hover:border-green-600 transition-colors"
          >
            <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">
              {shop.category}
            </span>
            <h3 className="font-semibold text-lg mt-1">{shop.name}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{shop.description}</p>
            <p className="text-xs text-gray-400 mt-2">{shop.address}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
