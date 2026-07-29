import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShopSettingsForm from "./ShopSettingsForm";

export default async function AdminShopSettingsPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, description, category, address, phone, self_delivery, approved, latitude, longitude"
    )
    .eq("id", shopId)
    .maybeSingle();

  if (!shop) notFound();

  return (
    <div>
      <Link href="/admin/vendors" className="text-sm text-gray-500 hover:underline">
        ← Vendors
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">{shop.name} — Shop Settings</h1>
      <ShopSettingsForm shop={shop} />
    </div>
  );
}
