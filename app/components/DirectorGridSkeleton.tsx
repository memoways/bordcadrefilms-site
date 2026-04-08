export default function DirectorGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-zinc-200 shadow-sm h-64 p-5 flex flex-col justify-end"
        >
          <div className="w-20 h-20 rounded-full bg-zinc-200 mb-4" />
          <div className="h-4 w-2/3 bg-zinc-200 rounded mb-2" />
          <div className="h-3 w-1/2 bg-zinc-100 rounded" />
        </div>
      ))}
    </section>
  );
}
