"use client";

import { useTransition } from "react";
import { assignRiderManually } from "./actions";

export default function AssignForm({
  deliveryId,
  riders,
  currentRiderId,
  label,
}: {
  deliveryId: string;
  riders: { id: string; full_name: string; available: boolean }[];
  currentRiderId?: string | null;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const riderId = String(formData.get("rider_id") || "");
        startTransition(() => assignRiderManually(deliveryId, riderId));
      }}
      className="flex gap-2 items-center"
    >
      <select
        name="rider_id"
        defaultValue={currentRiderId ?? ""}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
        required
      >
        <option value="">{label ?? "Assign rider manually..."}</option>
        {riders.map((r) => (
          <option key={r.id} value={r.id}>
            {r.full_name || "Rider"} {r.available ? "(online)" : "(offline)"}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        className="rounded-lg bg-gray-800 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60 whitespace-nowrap"
      >
        {currentRiderId ? "Reassign" : "Assign"}
      </button>
    </form>
  );
}
