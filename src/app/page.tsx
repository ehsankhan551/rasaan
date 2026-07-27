import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="bg-green-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Rasaan
          </h1>
          <p className="text-green-100 max-w-xl mx-auto mb-6">
            Order from local shops near you — delivered to
            your door, cash or online.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/shops"
              className="rounded-lg bg-white text-green-800 font-semibold px-5 py-2.5"
            >
              Browse Shops
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-white/60 text-white font-semibold px-5 py-2.5"
            >
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-1">For Customers</h3>
          <p className="text-sm text-gray-600">
            Browse shops, order what you need, and pay by cash on delivery or
            online.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-1">For Vendors</h3>
          <p className="text-sm text-gray-600">
            List your products, manage orders, and choose your own delivery
            or use platform riders.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-1">For Riders</h3>
          <p className="text-sm text-gray-600">
            Pick up available deliveries nearby and earn on your own
            schedule.
          </p>
        </div>
      </section>
    </main>
  );
}
