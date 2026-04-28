import FilmGridSkeleton from "../components/FilmGridSkeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-6xl w-full flex flex-col gap-8 items-center">
        <h1 className="text-3xl font-bold mb-2">Films</h1>
        <p className="text-sm text-zinc-500 mb-4">Comparison route: /completed-films-fixed</p>
        <FilmGridSkeleton />
      </div>
    </main>
  );
}
