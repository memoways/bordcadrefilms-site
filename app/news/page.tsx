import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SmartImage from "../components/SmartImage";
import { getNews } from "../lib/news";

export const metadata: Metadata = {
  title: "Newsroom — Bord Cadre Films",
  description: "Latest production updates, festival premieres and behind-the-scenes from Bord Cadre Films.",
};

function NewsGridSkeleton() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden flex flex-col shadow-sm">
          <div className="h-52 bg-zinc-100" />
          <div className="p-5 space-y-3 flex-1 flex flex-col">
            <div className="h-8 w-4/5 rounded bg-zinc-200" />
            <div className="h-4 w-1/3 rounded bg-zinc-200" />
            <div className="h-4 w-full rounded bg-zinc-200" />
            <div className="h-4 w-5/6 rounded bg-zinc-200" />
            <div className="h-10 w-32 rounded-lg bg-zinc-200 mt-2" />
          </div>
        </article>
      ))}
    </section>
  );
}

async function NewsContent() {
  const news = await getNews();

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-zinc-500">No news available at the moment.</p>
        <p className="text-zinc-400 text-sm">Check back soon.</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {news.map((item) => (
        <article
          key={item.slug}
          className="rounded-2xl border border-zinc-200 bg-white overflow-hidden flex flex-col shadow-sm"
        >
          <Link href={`/news/${item.slug}`} prefetch className="relative block h-52 bg-zinc-100">
            {item.image ? (
              <SmartImage
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                skeletonClassName="bg-zinc-100"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                <svg className="text-zinc-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <circle cx="12" cy="13.5" r="3" />
                  <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
            )}
          </Link>
          <div className="p-5 space-y-3 flex-1 flex flex-col">
            <h2 className="text-2xl font-medium text-zinc-900">{item.title}</h2>
            <p className="text-sm text-zinc-500">by {item.director}</p>
            <p className="text-zinc-700 leading-relaxed flex-1">{item.excerpt}</p>
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-100 transition"
              >
                Read article ↗
              </a>
            ) : (
              <Link
                href={`/news/${item.slug}`}
                prefetch
                className="inline-flex self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-100 transition"
              >
                Read update
              </Link>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-16 md:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-900">Newsroom</h1>
          <p className="text-zinc-600 max-w-2xl">
            Latest production updates, festival milestones, and behind-the-scenes moments from Bord Cadre Films.
          </p>
        </header>

        <Suspense fallback={<NewsGridSkeleton />}>
          <NewsContent />
        </Suspense>
      </div>
    </main>
  );
}
