import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

// Regenerate the sitemap at most once per hour so new shops/products get
// picked up without hammering the database on every crawl.
export const revalidate = 3600;

const BASE_URL = "https://www.rasaan.com.pk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/shops`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/deals`, changeFrequency: "daily", priority: 0.8 },
  ];

  const { data: shops } = await supabase
    .from("shops")
    .select("id, created_at")
    .eq("approved", true)
    .eq("active", true)
    .limit(2000);

  const shopRoutes: MetadataRoute.Sitemap = (shops ?? []).map((s) => ({
    url: `${BASE_URL}/shops/${s.id}`,
    lastModified: s.created_at ? new Date(s.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const { data: products } = await supabase
    .from("products")
    .select("id, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/products/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...shopRoutes, ...productRoutes];
}
