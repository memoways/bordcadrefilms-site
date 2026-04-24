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
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{tagline}</p>
        </div>
      </div>

      <div className="relative border border-zinc-200 rounded-2xl bg-white overflow-hidden">
        {/* Mock UI — blurred behind overlay */}
        <div className="p-6 blur-[2px] pointer-events-none select-none">
          <div className="flex items-center justify-between mb-5">
            <div className="h-5 w-32 bg-zinc-200 rounded" />
            <div className="h-8 w-28 bg-zinc-900 rounded-lg" />
          </div>
          <div className="space-y-2">
            {mock.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl"
              >
                <div className="w-8 h-8 shrink-0 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500 text-sm">
                  {glyph}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{row.title}</p>
                  {row.sub && <p className="text-xs text-zinc-500 truncate">{row.sub}</p>}
                </div>
                {row.meta && (
                  <span className="text-xs text-zinc-400 shrink-0">{row.meta}</span>
                )}
                <div className="h-7 w-14 bg-zinc-200 rounded-md" />
                <div className="h-7 w-7 bg-zinc-200 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="max-w-sm w-full mx-4 bg-white border border-zinc-200 rounded-xl shadow-xl p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xl">
              {glyph}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Available soon</p>
              <p className="text-xs text-zinc-500 mt-1">
                This module is being finalised. Here&apos;s what you&apos;ll be able to do:
              </p>
            </div>
            <ul className="text-left space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
                  <span className="text-zinc-400 leading-5">•</span>
                  <span className="leading-5">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/admin"
              className="inline-block text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
