"use client";

import { useTransition } from "react";
import { setAvailability } from "./actions";

export default function AvailabilityToggle({ available }: { available: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => setAvailability(!available))}
      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
        available ? "bg-green-700 text-white" : "bg-gray-200 text-gray-700"
      }`}
    >
      {available ? "You're online — accepting deliveries" : "You're offline — go online"}
    </button>
  );
}
