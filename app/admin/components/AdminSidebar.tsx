"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  preview?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "⊞" },
  { href: "/admin/home", label: "Home", icon: "⌂" },
  { href: "/admin/about", label: "About", icon: "◎" },
  { href: "/admin/team", label: "Team", icon: "◉" },
  { href: "/admin/news", label: "News", icon: "✎" },
  { href: "/admin/social", label: "Social media", icon: "⌘" },
];

const PREVIEW_NAV: NavItem[] = [
  { href: "/admin/films", label: "Films", icon: "▶", preview: true },
  { href: "/admin/directors", label: "Directors", icon: "◈", preview: true },
  { href: "/admin/newsletter", label: "Newsletter", icon: "✉", preview: true },
];

function NavLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.preview && (
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  Soon
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-400">
          Bord Cadre Films
        </p>
        <p className="text-sm font-semibold text-zinc-900 mt-0.5">Content Manager</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        <div>
          <NavLinks items={NAV} pathname={pathname} />
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            Coming soon
          </p>
          <NavLinks items={PREVIEW_NAV} pathname={pathname} />
        </div>
      </nav>

      {/* Help hint */}
      <div className="px-5 py-4 border-t border-zinc-100">
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Need help? Contact your site editor.
        </p>
      </div>
    </aside>
  );
}
