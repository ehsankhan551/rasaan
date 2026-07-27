import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="mx-auto max-w-6xl px-4 flex gap-4 text-sm py-2.5">
          <Link href="/admin" className="font-medium text-gray-700 hover:text-green-700">
            Overview
          </Link>
          <Link href="/admin/vendors" className="font-medium text-gray-700 hover:text-green-700">
            Vendors
          </Link>
          <Link href="/admin/orders" className="font-medium text-gray-700 hover:text-green-700">
            Orders
          </Link>
          <Link href="/admin/riders" className="font-medium text-gray-700 hover:text-green-700">
            Riders
          </Link>
        </nav>
      </div>
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</div>
    </div>
  );
}
