import type { Metadata } from "next";
import Toc from "./Toc";

export const metadata: Metadata = {
  title: "Architecture — Bord Cadre Films",
  description:
    "How the site keeps Airtable-fed images alive on long-running tabs: caching layers, self-healing components, performance budget, and the road ahead.",
};

const SECTIONS: { id: string; label: string }[] = [
  { id: "problem", label: "The problem" },
  { id: "stack", label: "Architecture stack" },
  { id: "caching", label: "Caching layers" },
  { id: "components", label: "Components" },
  { id: "loop", label: "Self-healing loop" },
  { id: "scenarios", label: "Scenarios coverage" },
  { id: "performance", label: "Performance budget" },
  { id: "nextjs", label: "Next.js best practices" },
  { id: "roadmap", label: "Next steps in code" },
  { id: "outside", label: "Outside-of-code options" },
  { id: "limits", label: "Known limits" },
  { id: "metrics", label: "What we monitor" },
];

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.8em] text-zinc-800">
      {children}
    </code>
  );
}

function SectionTitle({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <header className="mb-8">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        <span className="inline-block h-px w-8 bg-[#E0A75D]" />
        {kicker}
      </p>
      <h2 className="text-3xl font-semibold leading-tight text-zinc-900 sm:text-4xl">
        {children}
      </h2>
    </header>
  );
}

function Card({
  children,
  tone = "white",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "white" | "tinted" | "dark";
  className?: string;
}) {
  const toneClass =
    tone === "dark"
      ? "bg-[#1C1C1C] text-zinc-100 border-white/10"
      : tone === "tinted"
        ? "bg-linear-to-b from-white to-zinc-50/70 border-zinc-200"
        : "bg-white border-zinc-200";
  return (
    <div
      className={`rounded-2xl border ${toneClass} p-6 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.45)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function StackBox({
  title,
  detail,
  badge,
}: {
  title: string;
  detail: string;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {badge && (
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-1 text-zinc-400" aria-hidden>
      <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-2">
        <path
          d="M12 5v14m0 0l-5-5m5 5l5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Metric({
  value,
  unit,
  label,
  tone = "neutral",
}: {
  value: string;
  unit?: string;
  label: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const valueColor =
    tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-zinc-900";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>
        {value}
        {unit && <span className="ml-1 text-base font-medium text-zinc-500">{unit}</span>}
      </p>
    </div>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "info" }) {
  const map: Record<string, string> = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-[#E0A75D]/40 bg-[#E0A75D]/10 text-[#7a4f1c]",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Hero */}
      <section className="bg-linear-to-b from-white via-zinc-50 to-zinc-50 px-4 pb-16 pt-20 sm:px-6 md:pt-24 lg:px-10 lg:pb-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <span className="inline-block h-px w-8 bg-[#E0A75D]" />
            Engineering deep dive
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
            Keeping Airtable images alive on a long-running site.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-relaxed text-zinc-600 md:text-lg">
            Airtable serves attachment URLs that expire after roughly two hours. Without a strategy, every long-lived
            tab eventually shows broken-image icons. This page documents the layered system we built to make sure a
            visitor never sees one — and what is still on the table.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Pill tone="info">Next.js 16 — App Router</Pill>
            <Pill tone="info">React 19</Pill>
            <Pill tone="info">Vercel hosting</Pill>
            <Pill tone="info">Airtable CMS</Pill>
            <Pill tone="info">Tailwind v4</Pill>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="px-4 pb-32 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside>
            <Toc sections={SECTIONS} />
          </aside>

          <div className="space-y-24 [&_section]:scroll-mt-24">
            {/* PROBLEM */}
            <section id="problem">
              <SectionTitle kicker="01 — The problem">
                Signed URLs that quietly die.
              </SectionTitle>
              <Card>
                <p className="text-base leading-relaxed text-zinc-700">
                  Airtable&rsquo;s attachment fields don&rsquo;t expose stable URLs. Every fetch returns a freshly
                  signed link on the host{" "}
                  <Code>v5.airtableusercontent.com</Code> that is valid for ~2 hours. Once it expires, any browser
                  that still references it gets a <Pill tone="warn">403 Forbidden</Pill> and shows the native
                  broken-image icon next to the alt text.
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-700">
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Long-lived tab.</strong> A visitor opens the
                      gallery at 9pm, comes back at 9am — every poster is dead.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Cached HTML.</strong> Vercel&rsquo;s edge cache
                      can ship HTML containing URLs that already expired before the user even arrived.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Image optimizer eviction.</strong> Next.js caches
                      optimized blobs; when the cache evicts a blob whose origin URL has expired, refetch fails.
                    </span>
                  </li>
                </ul>
                <p className="mt-6 text-sm italic leading-relaxed text-zinc-500">
                  Real screenshots from a return visit showed 1 of 3 grid posters broken on{" "}
                  <Code>/completed-films</Code> and 4 broken slots on the gallery — a typical &ldquo;partial
                  expiry&rdquo; pattern.
                </p>
              </Card>
            </section>

            {/* STACK */}
            <section id="stack">
              <SectionTitle kicker="02 — Architecture stack">
                Where a poster lives between Airtable and your screen.
              </SectionTitle>
              <Card tone="tinted">
                <div className="mx-auto max-w-md space-y-2">
                  <StackBox
                    title="Airtable"
                    detail="Source of truth — attachments, ~50 films, signed URLs (~2h TTL)"
                    badge="Origin"
                  />
                  <Arrow label="REST API" />
                  <StackBox
                    title="getFilms() — unstable_cache"
                    detail="Processes records into Film[] (~200 KB). Revalidate 15 min, tag 'films'."
                    badge="RSC"
                  />
                  <Arrow label="Server render" />
                  <StackBox
                    title="Vercel — ISR + edge cache"
                    detail="Cached RSC payload. staleTimes:0 forces refetch on each Link click."
                    badge="Edge"
                  />
                  <Arrow label="HTML + RSC" />
                  <StackBox
                    title="Next.js Image optimizer (/_next/image)"
                    detail="Resizes + AVIF/WebP. Caches optimized blob 31 days (minimumCacheTTL)."
                    badge="CDN"
                  />
                  <Arrow label="<img>" />
                  <StackBox
                    title="Browser — SmartImage + LiveReload"
                    detail="Persistent skeleton, retries, escalation event, debounced refresh."
                    badge="Client"
                  />
                </div>
                <p className="mt-8 text-center text-xs italic leading-relaxed text-zinc-500">
                  The chain is mostly cache-friendly. The single fragile link is the original Airtable URL — every
                  layer below it inherits its expiry unless we intervene.
                </p>
              </Card>
            </section>

            {/* CACHING */}
            <section id="caching">
              <SectionTitle kicker="03 — Caching layers">Three caches, each with a different job.</SectionTitle>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                      <tr className="border-b border-zinc-200">
                        <th className="py-3 pr-4 font-semibold">Layer</th>
                        <th className="py-3 pr-4 font-semibold">Where</th>
                        <th className="py-3 pr-4 font-semibold">TTL</th>
                        <th className="py-3 font-semibold">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">
                          <Code>unstable_cache</Code>
                        </td>
                        <td className="py-4 pr-4">Filesystem, Vercel function</td>
                        <td className="py-4 pr-4 font-mono text-xs">15 min</td>
                        <td className="py-4">
                          Stores processed <Code>Film[]</Code>. The raw Airtable response (4&nbsp;MB) exceeds
                          Next.js&rsquo;s 2 MB fetch-cache limit, so caching at the post-processing level is mandatory.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">
                          <Code>staleTimes</Code>
                        </td>
                        <td className="py-4 pr-4">Browser router</td>
                        <td className="py-4 pr-4 font-mono text-xs">0 s</td>
                        <td className="py-4">
                          Disables client-side prefetch reuse. Each Link click refetches RSC so we never paint a stale
                          URL set on navigation. Cost: ~50–200 ms per click vs. instant.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">
                          <Code>minimumCacheTTL</Code>
                        </td>
                        <td className="py-4 pr-4">Vercel image CDN</td>
                        <td className="py-4 pr-4 font-mono text-xs">31 days</td>
                        <td className="py-4">
                          Optimized blobs (AVIF/WebP) live long even when their origin URL has died. Saves bandwidth
                          and turns the optimizer into our de-facto CDN mirror.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">
                          <Code>React cache()</Code>
                        </td>
                        <td className="py-4 pr-4">Single render pass</td>
                        <td className="py-4 pr-4 font-mono text-xs">1 request</td>
                        <td className="py-4">
                          Deduplicates <Code>getFilms()</Code> across <Code>generateMetadata</Code> + the page body so
                          we never hit <Code>unstable_cache</Code> twice for the same render.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">
                          <Code>revalidateTag(&apos;films&apos;)</Code>
                        </td>
                        <td className="py-4 pr-4">On-demand, server</td>
                        <td className="py-4 pr-4 font-mono text-xs">Manual</td>
                        <td className="py-4">
                          Hit by the admin app after a mutation; pairs with <Code>BroadcastChannel</Code> on the
                          client so any open tab refreshes immediately.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* COMPONENTS */}
            <section id="components">
              <SectionTitle kicker="04 — Components">Two files do all the heavy lifting.</SectionTitle>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">app/components/</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">SmartImage.tsx</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    A drop-in replacement for <Code>next/image</Code> that guarantees a skeleton until the actual
                    image paints — and never shows the browser&rsquo;s broken-icon, even on URL expiry.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-zinc-700">
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        Pulse-skeleton overlay rendered with{" "}
                        <Code>absolute inset-0 z-0 animate-pulse</Code>; image stays{" "}
                        <Code>invisible</Code> until <Code>onLoad</Code>.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        On <Code>onError</Code>: 3 retries with back-off (800 / 2000 / 5000 ms) by remounting
                        through a <Code>key</Code> bump.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        After retries are spent: dispatches{" "}
                        <Code>window.dispatchEvent(new CustomEvent(&apos;bcf:image-failed&apos;))</Code> exactly
                        once.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        Detects <Code>src</Code> changes via a <Code>useState</Code> tracker — when{" "}
                        <Code>router.refresh()</Code> brings fresh URLs, state resets cleanly without a manual{" "}
                        <Code>key</Code> on every call site.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        Tunable <Code>skeletonClassName</Code> per call site — zinc-100 on white grids,
                        zinc-800/900 on dark sections, white/10 on near-black asides.
                      </span>
                    </li>
                  </ul>
                  <p className="mt-5 text-xs italic leading-relaxed text-zinc-500">
                    Used by FilmCard, FilmDetail, GalleryCarousel, NewsCarousel, DirectorCard, About* and detail
                    routes. The header logo (<Code>/logo-bcf.svg</Code>, local) stays on plain{" "}
                    <Code>next/image</Code>.
                  </p>
                </Card>
                <Card>
                  <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">app/components/</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">LiveReload.tsx</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    Mounted once in the root layout. Owns every signal that should trigger a soft refresh of the
                    current route segment.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-zinc-700">
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        <Code>bcf:revalidate</Code> &amp; <Code>BroadcastChannel</Code> — admin mutations reach any
                        open tab and trigger an immediate <Code>router.refresh()</Code>.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        <Code>bcf:image-failed</Code> — debounced 3 s, throttled max 1 × / 30 s. Avoids refresh
                        storms when many cards error in parallel.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        <Code>visibilitychange</Code> — tracks last-active timestamp, refreshes when the tab
                        regains focus after &gt;90 min idle.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        <Code>pageshow</Code> — catches bfcache restoration on iOS Safari with the same idle
                        guard.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-mono text-xs text-[#E0A75D]">·</span>
                      <span>
                        Uses <Code>useRouter()</Code> from <Code>next/navigation</Code> so refresh is RSC-only —
                        client state (carousel index, lightbox state, scroll) is preserved.
                      </span>
                    </li>
                  </ul>
                  <p className="mt-5 text-xs italic leading-relaxed text-zinc-500">
                    Returns <Code>null</Code> — pure side-effect component. Cleans up every listener and timer on
                    unmount.
                  </p>
                </Card>
              </div>
            </section>

            {/* SELF-HEALING LOOP */}
            <section id="loop">
              <SectionTitle kicker="05 — Self-healing loop">
                The five steps that turn a 403 into a clean re-paint.
              </SectionTitle>
              <Card tone="dark">
                <ol className="space-y-5 text-sm leading-relaxed">
                  {[
                    {
                      n: "01",
                      t: "Image fails to load",
                      d: (
                        <>
                          Browser fires <Code>onError</Code> on{" "}
                          <Code>&lt;img&gt;</Code>. SmartImage keeps the skeleton visible and schedules retry #1
                          after 800 ms by bumping its{" "}
                          <Code>key</Code>.
                        </>
                      ),
                    },
                    {
                      n: "02",
                      t: "Retries exhausted",
                      d: (
                        <>
                          After 3 back-off retries (800 / 2000 / 5000 ms), SmartImage dispatches a single{" "}
                          <Code>bcf:image-failed</Code> CustomEvent. The skeleton remains — the user never sees a
                          broken icon.
                        </>
                      ),
                    },
                    {
                      n: "03",
                      t: "LiveReload debounces",
                      d: (
                        <>
                          Multiple SmartImages on the same page fire in a burst (e.g. a grid of 12). LiveReload
                          coalesces them into a single <Code>setTimeout(refresh, 3000)</Code>, then enforces a 30-s
                          cooldown.
                        </>
                      ),
                    },
                    {
                      n: "04",
                      t: "router.refresh()",
                      d: (
                        <>
                          Re-fetches the current route&rsquo;s RSC payload from the server.{" "}
                          <Code>getFilms()</Code> is bypassed by{" "}
                          <Code>unstable_cache</Code> only if the entry is fresh — otherwise it hits Airtable for
                          fresh signed URLs.
                        </>
                      ),
                    },
                    {
                      n: "05",
                      t: "SmartImage detects new src",
                      d: (
                        <>
                          The <Code>useState</Code> tracker spots a new <Code>src</Code> prop, resets{" "}
                          <Code>loaded / attempt / escalated</Code>, and re-renders the image with the fresh URL.
                          Skeleton fades out as <Code>onLoad</Code> finally fires.
                        </>
                      ),
                    },
                  ].map(({ n, t, d }) => (
                    <li key={n} className="flex items-start gap-5">
                      <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E0A75D]/45 bg-[#E0A75D]/15 font-mono text-xs font-semibold text-[#F6DCA0]">
                        {n}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-100">{t}</p>
                        <p className="mt-1 text-zinc-300">{d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-8 border-t border-white/10 pt-5 text-xs leading-relaxed text-zinc-400">
                  <strong className="font-medium text-zinc-200">Why no infinite loop?</strong> The 30-s cooldown +
                  the &ldquo;escalated once&rdquo; ref guard inside SmartImage make sure the same image cannot
                  trigger more than one refresh per cooldown window. If URLs come back still expired (extremely
                  rare), the user sees skeletons until <Code>unstable_cache</Code> revalidates and finally returns
                  fresh data.
                </div>
              </Card>
            </section>

            {/* SCENARIOS */}
            <section id="scenarios">
              <SectionTitle kicker="06 — Scenarios coverage">
                Every plausible failure path, mapped to the layer that catches it.
              </SectionTitle>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                      <tr className="border-b border-zinc-200">
                        <th className="py-3 pr-4 font-semibold">Scenario</th>
                        <th className="py-3 pr-4 font-semibold">Trigger</th>
                        <th className="py-3 pr-4 font-semibold">Caught by</th>
                        <th className="py-3 font-semibold">User experience</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">Tab idle &gt;90 min, returns</td>
                        <td className="py-4 pr-4">
                          <Code>visibilitychange</Code>
                        </td>
                        <td className="py-4 pr-4">LiveReload</td>
                        <td className="py-4">Soft refresh fires before any image is repainted. Invisible.</td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">iOS Safari bfcache restore</td>
                        <td className="py-4 pr-4">
                          <Code>pageshow.persisted</Code>
                        </td>
                        <td className="py-4 pr-4">LiveReload</td>
                        <td className="py-4">Same as above.</td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">Cold visit, ISR HTML stale</td>
                        <td className="py-4 pr-4">First render with dead URLs</td>
                        <td className="py-4 pr-4">SmartImage retries</td>
                        <td className="py-4">Skeleton, then refresh, then fresh paint within ~3-5 s.</td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">Optimizer cache evicted</td>
                        <td className="py-4 pr-4">CDN miss + dead origin</td>
                        <td className="py-4 pr-4">SmartImage retries</td>
                        <td className="py-4">Same — escalation if optimizer also fails.</td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">Admin updates a film</td>
                        <td className="py-4 pr-4">
                          <Code>revalidateTag</Code> + BroadcastChannel
                        </td>
                        <td className="py-4 pr-4">LiveReload</td>
                        <td className="py-4">Open tabs reflect the change instantly, no F5.</td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">Storm: 30 cards expire at once</td>
                        <td className="py-4 pr-4">30 × <Code>onError</Code></td>
                        <td className="py-4 pr-4">LiveReload debounce 3 s</td>
                        <td className="py-4">One refresh, not thirty.</td>
                      </tr>
                      <tr>
                        <td className="py-4 pr-4 font-medium text-zinc-900">Refresh fails to repair URL</td>
                        <td className="py-4 pr-4">
                          <Code>unstable_cache</Code> still warm
                        </td>
                        <td className="py-4 pr-4">30-s cooldown + cache TTL</td>
                        <td className="py-4">Skeleton until cache revalidates (max 15 min). Better than broken icon.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* PERFORMANCE */}
            <section id="performance">
              <SectionTitle kicker="07 — Performance budget">What the system actually costs.</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="SmartImage source" value="~1.6" unit="KB gz" tone="good" />
                <Metric label="LiveReload source" value="~1.3" unit="KB gz" tone="good" />
                <Metric label="Films payload" value="~200" unit="KB" />
                <Metric label="Single optimized poster" value="~80" unit="KB AVIF" tone="good" />
                <Metric label="Refresh cooldown" value="30" unit="s" />
                <Metric label="Idle threshold" value="90" unit="min" />
                <Metric label="Image cache TTL" value="31" unit="d" tone="good" />
                <Metric label="ISR revalidate" value="15" unit="min" />
                <Metric label="Retries before escalation" value="3" tone="warn" />
              </div>
              <Card className="mt-6">
                <h3 className="text-lg font-semibold text-zinc-900">Trade-offs we accepted</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700">
                  <li className="flex gap-3">
                    <Pill tone="warn">+50–200 ms</Pill>
                    <span>
                      Every <Code>&lt;Link&gt;</Code> click pays a soft RSC refetch (
                      <Code>staleTimes:0</Code>). Acceptable for a content-light site; would not be on a SaaS app.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Pill tone="warn">2 caches</Pill>
                    <span>
                      <Code>unstable_cache</Code> exists because raw Airtable JSON breaks Next.js&rsquo;s 2 MB
                      fetch-cache limit. The dual layer is a workaround, not a feature.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Pill tone="good">No bundle bloat</Pill>
                    <span>
                      SmartImage is ~1.6 KB gzipped — under the noise floor. LiveReload sits in the root layout, so
                      its cost is paid once.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Pill tone="good">No new dependency</Pill>
                    <span>
                      Zero added <Code>node_modules</Code> for any of this. Only <Code>react</Code> +{" "}
                      <Code>next</Code> primitives.
                    </span>
                  </li>
                </ul>
              </Card>
            </section>

            {/* NEXT.JS BEST PRACTICES */}
            <section id="nextjs">
              <SectionTitle kicker="08 — Next.js best practices">What we got right per the official docs.</SectionTitle>
              <Card>
                <ul className="space-y-4 text-sm leading-relaxed text-zinc-700">
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">Server Components first.</strong> Data fetching
                      lives in async RSC; client components only exist when interactivity demands it (carousel,
                      filters, pagination, image self-healing).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">remotePatterns over domains.</strong> Image
                      whitelist is explicit per official guidance — protocol, hostname,{" "}
                      <Code>pathname: &apos;/**&apos;</Code>. No wildcard host.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">priority on LCP candidates only.</strong> First
                      12 cards on <Code>/completed-films</Code> get <Code>priority</Code>; rest stay lazy.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">sizes attribute everywhere.</strong> Tells the
                      optimizer which width to ship per breakpoint — prevents over-fetching on mobile.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">React cache() wraps unstable_cache.</strong> Per
                      docs, the inner-cache + outer-React-cache pattern collapses repeated calls within a single
                      render to a single read.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">router.refresh() over window.location.reload().</strong>{" "}
                      Soft, RSC-only, preserves all client state — exactly what the App Router was designed for.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">Tag-based invalidation.</strong>{" "}
                      <Code>revalidateTag(&apos;films&apos;)</Code> from admin server actions — surgical, no full
                      rebuild.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">staleTimes: 0 — situational.</strong> Standard
                      docs caution against zero. We accept the trade because Airtable URL freshness matters more
                      than 200 ms.
                    </span>
                  </li>
                </ul>
              </Card>
            </section>

            {/* ROADMAP */}
            <section id="roadmap">
              <SectionTitle kicker="09 — Next steps in code">What ships next, what waits.</SectionTitle>
              <div className="space-y-5">
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Bug 3 — Background preload of next page
                    </h3>
                    <Pill tone="info">Planned</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    The <Code>/completed-films</Code> grid already ships the full <Code>Film[]</Code> client-side,
                    so &ldquo;Load more&rdquo; is data-instant. The perceived delay is purely image fetch on
                    rows 13–24.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                    <li>
                      <Code>IntersectionObserver</Code> on the last visible card — fires preload when it crosses
                      70 % viewport.
                    </li>
                    <li>
                      Render hidden <Code>&lt;SmartImage loading=&quot;eager&quot;&gt;</Code> for{" "}
                      <Code>visibleCount → visibleCount + PAGE_SIZE</Code> in an{" "}
                      <Code>absolute opacity-0 pointer-events-none</Code> block.
                    </li>
                    <li>
                      <Code>onMouseEnter</Code> on the &ldquo;Load more&rdquo; button as a desktop bonus trigger.
                    </li>
                    <li>
                      One-shot per slice via <Code>useRef</Code>; cleans itself when slice becomes visible.
                    </li>
                  </ul>
                </Card>
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Bug 1 — Mobile crash on Load more (Vercel deployed)
                    </h3>
                    <Pill tone="warn">Investigating</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    Real-mobile reproduction needed; suspected to be a render-time throw on a specific Film record
                    (malformed URL hitting <Code>next/image</Code>). Now that SmartImage absorbs render-time image
                    failures, this may be auto-fixed — to be re-tested.
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Live-test: 2-h idle real browser run
                    </h3>
                    <Pill>Pending</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    Open a tab on the gallery, leave for 2&nbsp;h, observe behaviour. Validates the
                    visibilitychange + image-failed escalation in real conditions.
                  </p>
                </Card>
              </div>
            </section>

            {/* OUTSIDE OF CODE */}
            <section id="outside">
              <SectionTitle kicker="10 — Outside-of-code options">
                Things that fix the root cause but require ops or a service.
              </SectionTitle>
              <div className="space-y-5">
                <Card>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Image proxy route — <Code>/api/img/[id]</Code>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Emit a stable URL in the HTML and resolve the Airtable signed link JIT on the server. Pros:
                    eliminates URL expiry from the client surface entirely. Cons: function invocations per image
                    request (cost), needs an in-memory or KV cache to avoid hammering Airtable.
                  </p>
                  <p className="mt-3 text-xs text-zinc-500">
                    Best paired with{" "}
                    <Code>Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400</Code> at the edge.
                  </p>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold text-zinc-900">CDN mirror — Vercel Blob, S3 or R2</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Mirror Airtable attachments to a permanent bucket on upload (via webhook + automation: Make,
                    Zapier, n8n). Store the permanent URL in a separate text field on the same record. Pros: zero
                    expiry forever. Cons: requires a durable upload-complete trigger; cost scales with attachment
                    count.
                  </p>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Third-party CDN — FilePost, Cloudinary, ImageKit
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Fully managed alternative to a self-hosted mirror. The article that prompted this review
                    (filepost.dev) recommends FilePost for exactly this use case. Pros: zero ops. Cons: vendor
                    lock-in, monthly cost beyond the free tier (300 uploads/month).
                  </p>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold text-zinc-900">Airtable webhook → Vercel Deploy Hook</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Bypass cache invalidation entirely: rebuild the site on every Airtable change. Pros: simplest
                    mental model. Cons: build minutes cost, multi-minute lag from edit to live, breaks if Vercel
                    quota is hit.
                  </p>
                </Card>
              </div>
            </section>

            {/* LIMITS */}
            <section id="limits">
              <SectionTitle kicker="11 — Known limits">Where the system is pragmatic, not perfect.</SectionTitle>
              <Card>
                <ul className="space-y-4 text-sm leading-relaxed text-zinc-700">
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">router.refresh refreshes the route, not the component.</strong>{" "}
                      It is the smallest soft-refresh primitive Next.js gives us. A truly per-component repaint
                      would need an API route returning fresh URLs and client-side state for each carousel — extra
                      surface for marginal UX gain.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">Long visibility blackouts.</strong> Tab kept
                      active for 3+ hours without ever losing focus is the worst case — URLs expire silently until
                      a SmartImage <em>tries</em> to load. Skeleton appears for ~3-5 s while the refresh travels.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">No automated regression tests.</strong>{" "}
                      Playwright is installed but no test exercises the URL-expiry path. Manual reproduction
                      currently means waiting 2&nbsp;h or DevTools-blocking the Airtable host.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">No observability.</strong> A 403 from the
                      optimizer on an evicted blob is silent in production logs. Adding a tiny beacon endpoint
                      hit by SmartImage on escalation would surface real-world frequency.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-medium text-zinc-900">CustomEvent over Context.</strong> SmartImage and
                      LiveReload are decoupled via <Code>window.dispatchEvent</Code> for portability. A React
                      Context would make typing stricter at the price of a provider wrapper. Acceptable today,
                      revisit if the contract grows.
                    </span>
                  </li>
                </ul>
              </Card>
            </section>

            {/* METRICS */}
            <section id="metrics">
              <SectionTitle kicker="12 — What we monitor">Or rather, what we should.</SectionTitle>
              <Card>
                <ul className="space-y-3 text-sm leading-relaxed text-zinc-700">
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Web Vitals (LCP, INP, CLS).</strong> Vercel
                      Analytics already collects these. LCP is the canary for the priority-on-first-12 strategy.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Image optimizer 4xx/5xx ratio.</strong> Visible
                      in Vercel function logs — sustained &gt;1 % means stale URLs are slipping through.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Custom beacon: bcf:image-failed counter.</strong>{" "}
                      Add a <Code>POST /api/beacon/image-failed</Code> route, fire-and-forget on escalation, store
                      in a daily counter. The single best signal for &ldquo;is the system holding up?&rdquo;.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0A75D]" />
                    <span>
                      <strong className="font-medium text-zinc-900">Bundle size budget.</strong> A small note in the
                      build script asserting{" "}
                      <Code>app/architecture/page.tsx</Code> doesn&rsquo;t accidentally import a heavy chart
                      library, etc.
                    </span>
                  </li>
                </ul>
              </Card>
            </section>

            <footer className="pt-8 text-sm text-zinc-500">
              <p>
                Drafted alongside the implementation on 2026-04-26. Owner: the codebase. Review next when the
                third-party CDN option becomes worth the operational cost.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
