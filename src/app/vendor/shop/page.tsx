import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShopForm from "./ShopForm";

export default async function VendorShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/shop");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, description, category, address, phone, self_delivery, approved")
    .eq("vendor_id", user.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shop Profile</h1>
      <ShopForm shop={shop} />
    </div>
  );
}
