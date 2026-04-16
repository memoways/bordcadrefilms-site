import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getFilms } from "../../lib/catalog";
import { readTeam } from "../../lib/about";

export const revalidate = 0; // Always fresh in admin

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: boolean;
};

function StatCard({ label, value, sub, href, accent }: StatCardProps) {
  const inner = (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-1 transition-colors ${
        accent
          ? "bg-zinc-900 border-zinc-800 text-white"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <span className={`text-xs uppercase tracking-widest font-medium ${accent ? "text-zinc-400" : "text-zinc-400"}`}>
        {label}
      </span>
      <span className={`text-3xl font-bold tabular-nums leading-none ${accent ? "text-white" : "text-zinc-900"}`}>
        {value}
      </span>
      {sub && (
        <span className={`text-xs mt-1 ${accent ? "text-zinc-500" : "text-zinc-400"}`}>{sub}</span>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

const QUICK_ACTIONS = [
  { label: "Edit home section", href: "/admin/home", desc: "Hero, About blurb, stats" },
  { label: "Manage team", href: "/admin/team", desc: "Add, reorder, edit members" },
  { label: "Update about", href: "/admin/about", desc: "Founder bio, festival gallery" },
];

const ISR_TAGS = [
  { tag: "team", label: "Team", path: "/about" },
  { tag: "site-config", label: "Site config", path: "/" },
  { tag: "all", label: "All pages", path: "/" },
];

export default async function AdminDashboard() {
  const user = await currentUser();

  const [filmsResult, teamResult] = await Promise.allSettled([
    getFilms(),
    readTeam(),
  ]);

  const filmCount = filmsResult.status === "fulfilled" ? filmsResult.value.length : "—";
  const teamCount = teamResult.status === "fulfilled" ? teamResult.value.total : "—";

  const firstName = user?.firstName ?? "Admin";

  return (
    <div className="max-w-4xl space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Hello, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Bord Cadre Films CMS — manage content, revalidate pages, track changes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Films" value={filmCount} sub="in catalogue" accent />
        <StatCard label="Team members" value={teamCount} href="/admin/team" />
        <StatCard label="Sprint" value="2 ✓" sub="Build passing" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
            Quick actions
          </h2>
          <ul className="space-y-1.5">
            {QUICK_ACTIONS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800 group-hover:text-zinc-900">
                      {a.label}
                    </p>
                    <p className="text-xs text-zinc-400">{a.desc}</p>
                  </div>
                  <span className="text-zinc-300 group-hover:text-zinc-600 text-lg leading-none">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ISR revalidation */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
            Revalidate cache
          </h2>
          <ul className="space-y-1.5">
            {ISR_TAGS.map((t) => (
              <li key={t.tag}>
                <RevalidateButton tag={t.tag} label={t.label} path={t.path} />
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-400 mt-3">
            Triggers on-demand ISR flush via <code className="bg-zinc-100 px-1 rounded">/api/revalidate</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// Client component inline — small enough not to warrant a separate file
function RevalidateButton({
  tag,
  label,
  path,
}: {
  tag: string;
  label: string;
  path: string;
}) {
  return (
    <form action={`/api/admin/revalidate`} method="POST">
      <input type="hidden" name="tag" value={tag} />
      <button
        type="submit"
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-left"
      >
        <div>
          <span className="text-sm font-medium text-zinc-800">{label}</span>
          <span className="text-xs text-zinc-400 ml-2">{path}</span>
        </div>
        <span className="text-xs text-zinc-400 font-mono">↺</span>
      </button>
    </form>
  );
}
