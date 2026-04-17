"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "⊞" },
  { href: "/admin/home", label: "Home", icon: "⌂" },
  { href: "/admin/about", label: "About", icon: "◎" },
  { href: "/admin/team", label: "Team", icon: "◉" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-400">
          Bord Cadre Films
        </p>
        <p className="text-sm font-semibold text-zinc-900 mt-0.5">Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
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
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer hint */}
      <div className="px-5 py-4 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400">v2.0 · Sprint 2 ✓</p>
      </div>
    </aside>
  );
}
