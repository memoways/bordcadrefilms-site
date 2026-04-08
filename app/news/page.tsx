import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getNews } from "../lib/news";

export const metadata: Metadata = {
  title: "Newsroom — Bord Cadre Films",
  description: "Les dernières nouvelles de production, premières en festival et coulisses de Bord Cadre Films.",
};

function NewsGridSkeleton() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden flex flex-col">
          <div className="h-52 bg-zinc-800" />
          <div className="p-5 space-y-3 flex-1 flex flex-col">
            <div className="h-8 w-4/5 rounded bg-zinc-800" />
            <div className="h-4 w-1/3 rounded bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-800" />
            <div className="h-4 w-5/6 rounded bg-zinc-800" />
            <div className="h-10 w-32 rounded-lg bg-zinc-800 mt-2" />
          </div>
        </article>
      ))}
    </section>
  );
}

async function NewsContent() {
  const news = await getNews();

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {news.map((item) => (
        <article
          key={item.slug}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden flex flex-col"
        >
          <Link href={`/news/${item.slug}`} prefetch className="relative block h-52 bg-zinc-900">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </Link>
          <div className="p-5 space-y-3 flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
            <p className="text-sm text-zinc-400">by {item.director}</p>
            <p className="text-zinc-300 leading-relaxed flex-1">{item.excerpt}</p>
            <Link
              href={`/news/${item.slug}`}
              prefetch
              className="inline-flex self-start rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 transition"
            >
              Read update
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}

export default function NewsPage() {
  return (
    <main className="min-h-screen brand-dark-surface text-zinc-100 px-4 py-16 md:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Newsroom</h1>
          <p className="text-zinc-400 max-w-2xl">
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
