import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
        <div>
          <h3 className="text-white font-semibold mb-3">Shop</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/products" className="hover:text-white">
                Browse Products
              </Link>
            </li>
            <li>
              <Link href="/shops" className="hover:text-white">
                Browse Shops
              </Link>
            </li>
            <li>
              <Link href="/deals" className="hover:text-white">
                Today&apos;s Deals
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-white">
                Wishlist
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Shop by Department</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/products?department=Men" className="hover:text-white">
                Men
              </Link>
            </li>
            <li>
              <Link href="/products?department=Women" className="hover:text-white">
                Women
              </Link>
            </li>
            <li>
              <Link href="/products?department=Kids" className="hover:text-white">
                Kids
              </Link>
            </li>
            <li>
              <Link href="/products?department=Baby" className="hover:text-white">
                Baby
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Sell &amp; Deliver</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/signup" className="hover:text-white">
                Become a Vendor
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-white">
                Become a Rider
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Vendor / Rider Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Account</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/login" className="hover:text-white">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-white">
                Sign up
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-white">
                My Account
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Rasaan. All rights reserved.</p>
          <p>Pakistan&apos;s local online marketplace — groceries, pharmacy, fashion &amp; electronics.</p>
        </div>
      </div>
    </footer>
  );
}
