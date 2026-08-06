import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rasaan.com.pk"),
  title: {
    default: "Rasaan — Online Marketplace in Pakistan | Groceries, Pharmacy, Fashion & Electronics",
    template: "%s | Rasaan",
  },
  description:
    "Rasaan is Pakistan's local online marketplace — shop groceries, medicine, electronics, fashion, cosmetics and more from shops near you. Cash on delivery or pay online.",
  keywords: [
    "Rasaan",
    "Rasaan.com.pk",
    "Rasaan Pakistan",
    "online marketplace Pakistan",
    "online grocery Pakistan",
    "online pharmacy Pakistan",
    "local shops online Pakistan",
    "buy groceries online Pakistan",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rasaan — Online Marketplace in Pakistan",
    description:
      "Shop groceries, medicine, electronics, fashion and more from local shops near you. Cash on delivery or pay online.",
    url: "https://www.rasaan.com.pk",
    siteName: "Rasaan",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rasaan — Online Marketplace in Pakistan",
    description:
      "Shop groceries, medicine, electronics, fashion and more from local shops near you.",
  },
  verification: {
    google: "NwBqe5f5S-NjlwU9I7YH3zFLU5LWjHiQkiNzi-WbAjw",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rasaan",
  alternateName: ["Rasaan.com.pk", "Rasaan Pakistan"],
  url: "https://www.rasaan.com.pk",
  logo: "https://www.rasaan.com.pk/favicon.ico",
  description:
    "Rasaan is Pakistan's local online marketplace connecting shops, customers, and delivery riders — groceries, medicine, electronics, fashion, and more.",
  areaServed: "PK",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Rasaan",
  url: "https://www.rasaan.com.pk",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.rasaan.com.pk/products?search={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
