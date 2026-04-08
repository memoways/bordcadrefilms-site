import DirectorGridSkeleton from "../components/DirectorGridSkeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-6xl w-full flex flex-col gap-8 items-center">
        <h1 className="text-3xl font-bold mb-8">Réalisateurs & Réalisatrices</h1>
        <DirectorGridSkeleton count={6} />
      </div>
    </main>
  );
}
