"use client";

import { useEffect, useState } from "react";

// Renders nothing if there's no end time or it has already passed — deals
// without an expiry just stay on unlimited, no badge needed.
function format(msLeft: number): string {
  if (msLeft <= 0) return "";
  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `Ends in ${days}d ${hours}h`;
  if (hours > 0) return `Ends in ${hours}h ${minutes}m`;
  return `Ends in ${minutes}m`;
}

export default function DealCountdown({
  endsAt,
  className,
}: {
  endsAt: string | null | undefined;
  className?: string;
}) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    if (!endsAt) {
      setLabel("");
      return;
    }
    const target = new Date(endsAt).getTime();
    function tick() {
      setLabel(format(target - Date.now()));
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!label) return null;

  return (
    <span className={className ?? "text-[10px] font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5 w-fit"}>
      ⏱ {label}
    </span>
  );
}
