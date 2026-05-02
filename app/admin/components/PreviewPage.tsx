import Link from "next/link";

type MockRow = {
  title: string;
  sub?: string;
  meta?: string;
};

type Props = {
  title: string;
  tagline: string;
  features: string[];
  mock: MockRow[];
  accent?: "films" | "directors" | "newsletter";
};

const ACCENT_GLYPH: Record<NonNullable<Props["accent"]>, string> = {
  films: "▶",
  directors: "◈",
  newsletter: "✉",
};

export default function PreviewPage({
  title,
  tagline,
  features,
  mock,
  accent = "films",
}: Props) {
  const glyph = ACCENT_GLYPH[accent];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-amber-100 text-amber-800 shadow-xs border border-amber-200">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1 font-medium">{tagline}</p>
        </div>
      </div>

      <div className="relative border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-xs min-h-[500px] flex flex-col">
        {/* Mock UI — blurred behind overlay */}
        <div className="p-8 blur-[3px] pointer-events-none select-none flex-1 opacity-40">
          <div className="flex items-center justify-between mb-8">
            <div className="h-6 w-48 bg-zinc-200 rounded-lg" />
            <div className="h-10 w-36 bg-zinc-900 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {mock.map((row, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-500 text-lg border border-zinc-300">
                    {glyph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-zinc-300 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-zinc-200 rounded" />
                  </div>
                </div>
                <div className="h-20 bg-zinc-100 rounded-xl border border-zinc-200" />
                <div className="flex justify-end gap-2">
                  <div className="h-8 w-16 bg-zinc-200 rounded-lg" />
                  <div className="h-8 w-8 bg-zinc-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/30 backdrop-blur-[2px]">
          <div className="max-w-md w-full mx-4 bg-white border border-zinc-200 rounded-3xl shadow-2xl p-8 text-center space-y-6 ring-1 ring-zinc-200">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-2xl shadow-lg transform -rotate-3">
              {glyph}
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-900">Module available soon</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                We are currently building this section of the CMS to ensure the best possible experience. Here&apos;s what is coming:
              </p>
            </div>
            
            <ul className="text-left bg-zinc-50 rounded-2xl p-5 border border-zinc-100 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-600">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 mt-0.5 font-bold">
                    ✓
                  </span>
                  <span className="leading-tight font-medium">{f}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-zinc-200"
              >
                <span>←</span>
                <span>Back to dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
