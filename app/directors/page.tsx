import { Suspense } from "react";
import type { Metadata } from "next";
import DirectorGrid from "../components/DirectorGrid";
import DirectorGridSkeleton from "../components/DirectorGridSkeleton";
import { getDirectors } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Directors — Bord Cadre Films",
  description: "Meet the directors whose work Bord Cadre Films produces.",
};

export const revalidate = 900;

async function DirectorsContent() {
  const directors = await getDirectors();
  return <DirectorGrid directors={directors} />;
}

export default function DirectorsPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white text-zinc-900">
      <div className="w-full bg-[#1C1C1C] py-16 flex items-center justify-center">
        <h1 className="text-5xl font-light text-accent">Directors</h1>
      </div>
      <div className="max-w-6xl w-full mx-auto px-4 py-16 flex flex-col gap-8">
        <Suspense fallback={<DirectorGridSkeleton count={10} />}>
          <DirectorsContent />
        </Suspense>
      </div>
    </main>
  );
}
