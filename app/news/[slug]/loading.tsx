export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-14 md:px-8">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1.1fr,1fr] gap-10 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-10 animate-pulse">
        <div className="space-y-5">
          <div className="h-4 w-28 bg-zinc-800 rounded" />
          <div className="h-12 w-5/6 bg-zinc-800 rounded" />
          <div className="h-6 w-40 bg-zinc-800 rounded" />
          <div className="h-8 w-40 bg-zinc-800 rounded" />
          <div className="h-4 w-44 bg-zinc-800 rounded" />
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full bg-zinc-800 rounded" />
            <div className="h-4 w-full bg-zinc-800 rounded" />
            <div className="h-4 w-2/3 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="w-full h-80 md:h-full min-h-[340px] rounded-2xl bg-zinc-800" />
      </div>
    </main>
  );
}
