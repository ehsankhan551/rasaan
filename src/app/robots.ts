import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/vendor", "/rider", "/account", "/checkout", "/api"],
      },
    ],
    sitemap: "https://www.rasaan.com.pk/sitemap.xml",
    host: "https://www.rasaan.com.pk",
  };
}
