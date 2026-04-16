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
  return <DirectorGrid directors={directors} showBio={false} />;
}

export default function DirectorsPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-6xl w-full flex flex-col gap-8 items-center">
        <h1 className="text-3xl font-bold mb-8">Directors</h1>
        <Suspense fallback={<DirectorGridSkeleton count={6} />}>
          <DirectorsContent />
        </Suspense>
      </div>
    </main>
  );
}
