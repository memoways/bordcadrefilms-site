import { Suspense } from "react";
import type { Metadata } from "next";
import FilmGrid from "../components/FilmGrid";
import FilmGridSkeleton from "../components/FilmGridSkeleton";
import { getFilms } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Films — Bord Cadre Films",
  description: "Discover films produced by Bord Cadre Films, an independent production company based in Geneva.",
};

export const revalidate = 900;

async function FilmsContent() {
  const films = await getFilms();
  return <FilmGrid films={films} />;
}

async function FilmsContentWithSearch({ initialSearch }: { initialSearch: string }) {
  const films = await getFilms();
  return <FilmGrid films={films} initialSearch={initialSearch} />;
}

export default async function CompletedFilmsPage({
  searchParams,
}: {
  searchParams: Promise<{ director?: string }>;
}) {
  const params = await searchParams;
  const initialSearch = params.director?.trim() ?? "";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-6xl w-full flex flex-col gap-8 items-center">
        <h1 className="text-3xl font-bold mb-8">Films</h1>
        <Suspense fallback={<FilmGridSkeleton />}>
          <FilmsContentWithSearch initialSearch={initialSearch} />
        </Suspense>
      </div>
    </main>
  );
}
