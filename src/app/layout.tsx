import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Rasaan",
  description: "Local marketplace for shops, customers, and delivery riders",
  verification: {
    google: "NwBqe5f5S-NjlwU9I7YH3zFLU5LWjHiQkiNzi-WbAjw",
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
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
