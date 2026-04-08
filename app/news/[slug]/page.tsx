import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNewsBySlug, getNews } from "../../lib/news";

export async function generateStaticParams() {
  const news = await getNews();
  return news.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  return {
    title: article ? `${article.title} — Bord Cadre Films` : "News — Bord Cadre Films",
    description: article?.excerpt,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return notFound();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-14 md:px-8">
      <article className="max-w-5xl mx-auto grid md:grid-cols-[1.1fr,1fr] gap-10 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-10">
        <div className="space-y-5">
          <Link href="/news" prefetch className="inline-flex text-sm text-zinc-400 hover:text-zinc-100 transition">
            Back to news
          </Link>
          <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">{article.title}</h1>
          <p className="text-lg text-zinc-300">by {article.director}</p>
          <div className="inline-flex rounded-md bg-zinc-200 text-zinc-900 px-3 py-1 text-sm font-semibold">
            {article.status}
          </div>
          <p className="text-sm text-zinc-400">{article.location}</p>
          <div className="space-y-4 pt-2">
            {article.content.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-zinc-200">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="relative w-full h-80 md:h-full min-h-[340px] rounded-2xl overflow-hidden bg-zinc-800">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 45vw"
            priority
          />
        </div>
      </article>
    </main>
  );
}
