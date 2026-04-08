/**
 * FilmDetailSkeleton.tsx
 * 
 * Skeleton component that matches FilmDetail dimensions exactly.
 * Prevents layout shift (CLS) when real content streams in.
 * Uses Tailwind animate-pulse for smooth visual feedback.
 */

export default function FilmDetailSkeleton() {
  return (
    <div className="w-full min-h-screen bg-zinc-50 pb-12">
      <section className="w-full border-b border-white/10 bg-[#1C1C1C] px-4 py-14 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-12 w-3/4 rounded bg-white/10 md:h-16" />
              <div className="h-5 w-64 rounded bg-white/10" />
              <div className="h-4 w-56 rounded bg-white/10" />
            </div>

            <div className="animate-pulse flex flex-wrap gap-2 pt-1">
              <div className="h-7 w-20 rounded-md bg-white/10" />
              <div className="h-7 w-24 rounded-md bg-white/10" />
              <div className="h-7 w-18 rounded-md bg-white/10" />
            </div>

            <div className="animate-pulse max-w-4xl border-l-2 border-white/20 pl-5 pt-2 space-y-3">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-5/6 rounded bg-white/10" />
            </div>

            <div className="animate-pulse h-10 w-36 rounded-full bg-white/10" />
          </div>

          <div className="animate-pulse rounded-[1.75rem] border border-[#E0A75D]/50 bg-[#171717] p-6">
            <div className="mx-auto mb-5 h-4 w-48 rounded bg-white/10" />
            <div className="mx-auto mb-5 h-18 w-18 rounded-2xl bg-white/10" />
            <div className="space-y-4">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="mx-auto h-px w-24 bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="mx-auto h-px w-24 bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* DETAILS GRID SKELETON */}
      <div className="max-w-6xl mx-auto px-4 mt-12 grid md:grid-cols-3 gap-8">
        {/* Videos column */}
        <div className="col-span-1">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-24 bg-zinc-200 rounded" />
            <div className="h-4 w-full bg-zinc-200 rounded" />
          </div>
        </div>

        {/* Content column */}
        <div className="col-span-2 flex flex-col gap-8">
          {/* Synopsis section */}
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-32 bg-zinc-200 rounded" />
            <div className="h-1 w-24 bg-zinc-400 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-200 rounded" />
              <div className="h-4 w-full bg-zinc-200 rounded" />
              <div className="h-4 w-2/3 bg-zinc-200 rounded" />
            </div>
          </div>

          {/* Team section */}
          <div className="animate-pulse space-y-3 bg-zinc-100 rounded-xl p-6">
            <div className="h-6 w-16 bg-zinc-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-zinc-200 rounded" />
              <div className="h-4 w-52 bg-zinc-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* GALLERY SECTION SKELETON */}
      <div className="w-full bg-zinc-900 py-12 mt-16">
        <div className="max-w-6xl mx-auto flex gap-6 px-4 overflow-x-auto">
          {/* Gallery image placeholders */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl overflow-hidden w-72 h-44 bg-zinc-800 shrink-0"
            />
          ))}
        </div>
      </div>

      {/* DIRECTOR STATEMENT SECTION SKELETON */}
      <div className="w-full bg-zinc-200 py-12 mt-0">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 px-4">
          {/* Left column - filmography */}
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-32 bg-zinc-400 rounded" />
            <div className="bg-white rounded-xl p-6 space-y-3">
              <div className="h-5 w-28 bg-zinc-200 rounded" />
              <div className="h-1 w-16 bg-zinc-400 rounded" />
              <div className="h-4 w-full bg-zinc-200 rounded" />
            </div>
          </div>

          {/* Right column - director statement */}
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-40 bg-zinc-400 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-300 rounded" />
              <div className="h-4 w-full bg-zinc-300 rounded" />
              <div className="h-4 w-2/3 bg-zinc-300 rounded" />
            </div>
            <div className="h-4 w-32 bg-zinc-400 rounded mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
