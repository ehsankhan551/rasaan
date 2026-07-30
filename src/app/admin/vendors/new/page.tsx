import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewShopForm from "./NewShopForm";

export default async function AdminNewShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/vendors/new");

  const { data: vendors } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "vendor")
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Shop</h1>
      <NewShopForm vendors={vendors ?? []} />
    </div>
  );
}
