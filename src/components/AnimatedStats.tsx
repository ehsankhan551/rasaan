"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { label: string; value: number; suffix?: string };

function useCountUp(target: number, active: boolean, durationMs = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;

    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationMs]);

  return value;
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const value = useCountUp(stat.value, active);
  return (
    <div className="text-center">
      <p className="text-2xl sm:text-3xl font-bold text-white">
        {value.toLocaleString()}
        {stat.suffix ?? "+"}
      </p>
      <p className="text-xs sm:text-sm text-green-100/80 mt-1">{stat.label}</p>
    </div>
  );
}

export default function AnimatedStats({
  productCount,
  shopCount,
  categoryCount,
  deliveredCount,
}: {
  productCount: number;
  shopCount: number;
  categoryCount: number;
  deliveredCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats: Stat[] = [
    { label: "Products", value: productCount },
    { label: "Local Shops", value: shopCount },
    { label: "Categories", value: categoryCount, suffix: "" },
    { label: "Orders Delivered", value: deliveredCount },
  ];

  return (
    <div ref={ref} className="bg-green-800">
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatItem key={s.label} stat={s} active={active} />
        ))}
      </div>
    </div>
  );
}
