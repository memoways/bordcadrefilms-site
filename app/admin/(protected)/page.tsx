import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getFilms } from "../../lib/catalog";
import { readTeam } from "../../lib/about";
import { getNews } from "../../lib/news";
import PublishButton from "./PublishButton";

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
      <span className="text-xs uppercase tracking-widest font-medium text-zinc-400">
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
  { label: "Edit home page", href: "/admin/home", desc: "Hero, about blurb, numbers" },
  { label: "Update about page", href: "/admin/about", desc: "Founder bio, festival gallery" },
  { label: "Manage team", href: "/admin/team", desc: "Add, reorder, edit members" },
  { label: "Manage news", href: "/admin/news", desc: "Publish updates, press, festivals" },
  { label: "Social media", href: "/admin/social", desc: "Footer links — Instagram, LinkedIn, etc." },
];

const PUBLISH_TAGS = [
  { tag: "team", label: "Team", path: "/about" },
  { tag: "news", label: "News", path: "/news" },
  { tag: "social-media", label: "Social media", path: "footer" },
  { tag: "site-config", label: "Home & about", path: "/" },
  { tag: "all", label: "Everything", path: "all pages" },
];

export default async function AdminDashboard() {
  const user = await currentUser();

  const [filmsResult, teamResult, newsResult] = await Promise.allSettled([
    getFilms(),
    readTeam(),
    getNews(),
  ]);

  const filmCount = filmsResult.status === "fulfilled" ? filmsResult.value.length : "—";
  const teamCount = teamResult.status === "fulfilled" ? teamResult.value.total : "—";
  const newsCount = newsResult.status === "fulfilled" ? newsResult.value.length : "—";

  const firstName = user?.firstName ?? "there";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Hello, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Welcome to the Bord Cadre Films content manager. Update pages and publish changes whenever you&apos;re ready.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Films" value={filmCount} sub="in catalogue" accent />
        <StatCard label="Team" value={teamCount} sub="members" href="/admin/team" />
        <StatCard label="News" value={newsCount} sub="published" href="/admin/news" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Quick actions */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            Quick actions
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all group shadow-xs"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800 group-hover:text-zinc-900">
                      {a.label}
                    </p>
                    <p className="text-xs text-zinc-400">{a.desc}</p>
                  </div>
                  <span className="text-zinc-300 group-hover:text-zinc-900 transform group-hover:translate-x-1 transition-all">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Publish changes */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            Publish to site
          </h2>
          <div className="bg-zinc-100/50 border border-zinc-200 rounded-2xl p-4 sm:p-6">
            <ul className="space-y-2">
              {PUBLISH_TAGS.map((t) => (
                <li key={t.tag}>
                  <PublishButton tag={t.tag} label={t.label} path={t.path} />
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500 mt-4 px-1">
              Changes are saved instantly but only go live on the public site after publishing.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
