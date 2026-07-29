"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Shop = {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type ShopWithDistance = Shop & { distance: number | null };

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyShops() {
  const [status, setStatus] = useState<
    "idle" | "locating" | "granted" | "denied" | "unsupported"
  >("idle");
  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAllShops(): Promise<Shop[]> {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("shops")
      .select("id, name, category, address, latitude, longitude")
      .eq("approved", true)
      .eq("active", true)
      .limit(50);
    setLoading(false);
    return data ?? [];
  }

  async function findNearby() {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      const all = await loadAllShops();
      setShops(all.map((s) => ({ ...s, distance: null })));
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const all = await loadAllShops();
        const withDistance: ShopWithDistance[] = all.map((s) => ({
          ...s,
          distance:
            s.latitude != null && s.longitude != null
              ? distanceKm(latitude, longitude, s.latitude, s.longitude)
              : null,
        }));
        withDistance.sort((a, b) => {
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
        setShops(withDistance);
        setStatus("granted");
      },
      async () => {
        setStatus("denied");
        const all = await loadAllShops();
        setShops(all.map((s) => ({ ...s, distance: null })));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      {status === "idle" && (
        <button
          onClick={findNearby}
          className="rounded-lg bg-green-700 text-white text-sm font-semibold px-4 py-2 mb-6"
        >
          Show shops near me
        </button>
      )}
      {status === "locating" && (
        <p className="text-sm text-gray-500 mb-6">Finding your location...</p>
      )}
      {status === "denied" && (
        <p className="text-sm text-amber-600 mb-4">
          Location access denied — showing all available shops instead.
        </p>
      )}
      {status === "unsupported" && (
        <p className="text-sm text-amber-600 mb-4">
          Your browser doesn&apos;t support location — showing all available shops instead.
        </p>
      )}

      {(status === "granted" || status === "denied" || status === "unsupported") && (
        <>
          {loading && <p className="text-sm text-gray-500">Loading shops...</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.slice(0, 6).map((s) => (
              <Link
                key={s.id}
                href={`/shops/${s.id}`}
                className="rounded-xl border border-gray-200 p-4 hover:border-green-400"
              >
                <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">
                  {s.category}
                </span>
                <p className="font-semibold mt-1">{s.name}</p>
                <p className="text-xs text-gray-500 mt-1">{s.address}</p>
                {s.distance != null && (
                  <p className="text-xs text-gray-400 mt-2">{s.distance.toFixed(1)} km away</p>
                )}
              </Link>
            ))}
          </div>
          {shops.length === 0 && !loading && (
            <p className="text-sm text-gray-500">No shops available right now.</p>
          )}
        </>
      )}
    </div>
  );
}
