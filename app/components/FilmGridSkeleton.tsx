export default function FilmGridSkeleton() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden animate-pulse">
          <div className="relative w-full aspect-2/3 bg-zinc-100">
            <div className="absolute inset-0 bg-linear-to-b from-zinc-100 via-zinc-200/70 to-zinc-100" />
          </div>

          <div className="p-3 flex flex-col gap-2">
            <div className="h-5 w-4/5 rounded bg-zinc-200" />
            <div className="h-4 w-2/3 rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </section>
  );
}
