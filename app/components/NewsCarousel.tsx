"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NewsItem } from "../lib/news";

type NewsCarouselProps = {
  items: NewsItem[];
  autoPlayMs?: number;
};

function statusClass(status: NewsItem["status"]): string {
  switch (status) {
    case "Currently shooting":
      return "bg-zinc-200 text-zinc-900";
    case "In post-production":
      return "bg-zinc-300 text-zinc-900";
    case "Festival premiere":
      return "bg-zinc-100 text-zinc-900";
    default:
      return "bg-zinc-100 text-zinc-900";
  }
}

export default function NewsCarousel({ items, autoPlayMs = 6500 }: NewsCarouselProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, autoPlayMs);

    return () => window.clearInterval(id);
  }, [items.length, autoPlayMs]);

  if (items.length === 0) return null;

  return (
    <section className="w-full brand-dark-surface text-zinc-100 py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">News</h2>
          <Link
            href="/news"
            prefetch
            className="text-sm md:text-base border border-zinc-700 px-4 py-2 rounded-full hover:bg-zinc-800 transition"
          >
            All news
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
            aria-live="polite"
          >
            {items.map((item) => (
              <article key={item.slug} className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 p-8 md:p-12 items-center">
                  <div className="space-y-5">
                    <h3 className="text-3xl md:text-4xl font-semibold text-white">{item.title}</h3>
                    <p className="text-lg font-medium">by {item.director}</p>
                    <p className="text-zinc-300 leading-relaxed">{item.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className={`inline-flex rounded-md px-3 py-1 text-sm font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-sm text-zinc-400">{item.location}</span>
                    </div>
                    <Link
                      href={`/news/${item.slug}`}
                      prefetch
                      className="inline-flex mt-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 transition"
                    >
                      Read the full update
                    </Link>
                  </div>

                  <Link href={`/news/${item.slug}`} prefetch className="block focus:outline-none focus:ring-2 focus:ring-white rounded-2xl">
                    <div className="relative w-full h-72 md:h-[360px] rounded-2xl overflow-hidden bg-zinc-900">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={active === 0}
                      />
                    </div>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {items.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all ${active === index ? "w-8 bg-white" : "w-2.5 bg-zinc-600 hover:bg-zinc-300"}`}
              aria-label={`Show news slide ${index + 1}`}
              aria-pressed={active === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
