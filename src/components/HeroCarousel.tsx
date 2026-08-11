"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Slide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Your neighborhood, online",
    title: "Everything your local shops sell — delivered to your door",
    subtitle: "Groceries, cosmetics, medicine, electronics and more from shops near you. Cash on delivery or pay online.",
    ctaLabel: "Shop All Products",
    ctaHref: "/products",
  },
  {
    eyebrow: "Save today",
    title: "Hot deals up to 40% off, every day",
    subtitle: "Real discounts across pharmacy, fashion, cosmetics and electronics — refreshed daily.",
    ctaLabel: "See Today's Deals",
    ctaHref: "/deals",
  },
  {
    eyebrow: "Shop your way",
    title: "Men, Women, Kids & Baby — all in one place",
    subtitle: "Browse by department to find exactly what your family needs, fast.",
    ctaLabel: "Explore Departments",
    ctaHref: "/products?department=Men",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 text-center">
      <p className="uppercase tracking-wide text-xs sm:text-sm font-semibold text-green-100/90 mb-3 transition-opacity duration-500">
        {slide.eyebrow}
      </p>
      <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight transition-all duration-500 min-h-[4.5rem] sm:min-h-[7rem] flex items-center justify-center">
        {slide.title}
      </h1>
      <p className="text-green-50/90 max-w-xl mx-auto mb-8 text-base sm:text-lg transition-opacity duration-500 min-h-[3rem]">
        {slide.subtitle}
      </p>
      <div className="flex justify-center gap-3 flex-wrap mb-8">
        <Link
          href={slide.ctaHref}
          className="rounded-xl bg-white text-green-800 font-semibold px-6 py-3 shadow-lg shadow-black/10 hover:bg-green-50 transition-colors"
        >
          {slide.ctaLabel}
        </Link>
        <Link
          href="/products"
          className="rounded-xl border border-white/50 bg-white/5 text-white font-semibold px-6 py-3 backdrop-blur hover:bg-white/15 transition-colors"
        >
          Browse All
        </Link>
      </div>
      <div className="flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
