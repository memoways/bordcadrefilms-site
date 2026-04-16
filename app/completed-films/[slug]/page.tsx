import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFilms } from "../../lib/catalog";
import FilmDetail from "../../components/FilmDetail";
import FilmDetailSkeleton from "../../components/FilmDetailSkeleton";

export const revalidate = 900;

function normalizeSlug(s: string | undefined): string {
  return typeof s === "string"
    ? s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    : "";
}

export async function generateStaticParams() {
  const films = await getFilms();
  return films.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // getFilms() is wrapped in React cache() — same request as the page body
  // shares the result, so this does NOT trigger a second Airtable fetch.
  const films = await getFilms();
  const film = films.find((f) => normalizeSlug(f.slug) === normalizeSlug(slug));
  return {
    title: film ? `${film.title} — Bord Cadre Films` : "Film — Bord Cadre Films",
    description: film?.synopsis ?? film?.bio,
  };
}

async function FilmContent({ slug }: { slug: string }) {
  const films = await getFilms();
  const film = films.find((f) => normalizeSlug(f.slug) === normalizeSlug(slug));
  if (!film) return notFound();
  return <FilmDetail film={film} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<FilmDetailSkeleton />}>
      <FilmContent slug={slug} />
    </Suspense>
  );
}
