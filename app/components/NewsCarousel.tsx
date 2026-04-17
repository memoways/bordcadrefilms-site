"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NewsItem } from "../lib/news";

type NewsCarouselProps = {
  items: NewsItem[];
  autoPlayMs?: number;
};

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
    <section className="w-full bg-background text-foreground py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-900">News</h2>
          <Link
            href="/news"
            prefetch
            className="text-sm md:text-base border border-zinc-300 px-4 py-2 rounded-full text-zinc-900 hover:bg-zinc-100 transition"
          >
            All news
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
            aria-live="polite"
          >
            {items.map((item, index) => (
              <article key={item.slug} className="w-full shrink-0">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 p-8 md:p-12 items-center">
                  <div className="space-y-5">
                    <h3 className="text-3xl md:text-4xl font-medium text-zinc-900">{item.title}</h3>
                    <p className="text-lg font-light text-zinc-600">by {item.director}</p>
                    <p className="text-zinc-700 leading-relaxed">{item.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className="inline-flex rounded-md px-3 py-1 text-sm font-semibold bg-zinc-100 text-zinc-900">
                        {item.status}
                      </span>
                      <span className="text-sm text-zinc-500">{item.location}</span>
                    </div>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-100 transition"
                      >
                        Read article ↗
                      </a>
                    ) : (
                      <Link
                        href={`/news/${item.slug}`}
                        prefetch
                        className="inline-flex mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-100 transition"
                      >
                        Read the full update
                      </Link>
                    )}
                  </div>

                  <Link href={`/news/${item.slug}`} prefetch className="block focus:outline-none focus:ring-2 focus:ring-white rounded-2xl">
                    <div className="relative w-full h-72 md:h-90 rounded-2xl overflow-hidden bg-zinc-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority={index === 0}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                          <svg className="text-zinc-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="3" y="7" width="18" height="13" rx="2" />
                            <circle cx="12" cy="13.5" r="3" />
                            <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                          </svg>
                        </div>
                      )}
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
              className={`h-2.5 rounded-full transition-all ${active === index ? "w-8 bg-zinc-900" : "w-2.5 bg-zinc-300 hover:bg-zinc-500"}`}
              aria-label={`Show news slide ${index + 1}`}
              aria-pressed={active === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
