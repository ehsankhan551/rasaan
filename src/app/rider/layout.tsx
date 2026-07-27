import Link from "next/link";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="mx-auto max-w-6xl px-4 flex gap-4 text-sm py-2.5">
          <Link href="/rider" className="font-medium text-gray-700 hover:text-green-700">
            Available Deliveries
          </Link>
          <Link href="/rider/deliveries" className="font-medium text-gray-700 hover:text-green-700">
            My Deliveries
          </Link>
        </nav>
      </div>
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</div>
    </div>
  );
}
