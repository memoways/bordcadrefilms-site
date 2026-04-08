export default function NewsCarouselSkeleton() {
  return (
    <section className="w-full bg-zinc-950 text-zinc-100 py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-10 w-36 bg-zinc-800 rounded" />
          <div className="h-10 w-24 bg-zinc-800 rounded-full" />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <div className="h-10 w-3/4 bg-zinc-800 rounded" />
              <div className="h-5 w-1/3 bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-800 rounded" />
              <div className="h-4 w-11/12 bg-zinc-800 rounded" />
              <div className="h-4 w-2/3 bg-zinc-800 rounded" />
              <div className="h-8 w-36 bg-zinc-800 rounded-md mt-3" />
            </div>
            <div className="h-72 md:h-[360px] w-full bg-zinc-800 rounded-2xl" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="h-2.5 w-8 bg-zinc-700 rounded-full" />
          <div className="h-2.5 w-2.5 bg-zinc-700 rounded-full" />
          <div className="h-2.5 w-2.5 bg-zinc-700 rounded-full" />
        </div>
      </div>
    </section>
  );
}
