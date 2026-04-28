import { Suspense } from "react";
import type { Metadata } from "next";
import FilmGridFixed from "./FilmGridFixed";
import FilmGridSkeleton from "../components/FilmGridSkeleton";
import { getFilms } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Films (Fixed comparison) — Bord Cadre Films",
  description: "Comparison page for Completed Films with rendering and image pipeline fixes.",
};

export const revalidate = 900;

async function FilmsContentWithSearch({ initialSearch }: { initialSearch: string }) {
  const films = await getFilms();
  return <FilmGridFixed films={films} initialSearch={initialSearch} />;
}

export default async function CompletedFilmsFixedPage({
  searchParams,
}: {
  searchParams: Promise<{ director?: string }>;
}) {
  const params = await searchParams;
  const initialSearch = params.director?.trim() ?? "";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-6xl w-full flex flex-col gap-8 items-center">
        <h1 className="text-3xl font-bold mb-2">Films</h1>
        <p className="text-sm text-zinc-500 mb-4">Comparison route: /completed-films-fixed</p>
        <Suspense fallback={<FilmGridSkeleton />}>
          <FilmsContentWithSearch initialSearch={initialSearch} />
        </Suspense>
      </div>
    </main>
  );
}
