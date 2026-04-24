"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type NavLink = { href: string; label: string; prefetch?: true };

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News", prefetch: true },
  { href: "/completed-films", label: "Films", prefetch: true },
  { href: "/directors", label: "Directors", prefetch: true },
  { href: "/about", label: "About", prefetch: true },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="w-full bg-white border-b border-zinc-200 shadow-sm sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
          <Image
            src="/logo-bcf.svg"
            alt="Logo Bord Cadre Films"
            width={120}
            height={50}
            className="h-8 w-auto transition-opacity group-hover:opacity-80"
            priority
          />
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-300 text-zinc-900 transition-colors hover:bg-zinc-100 md:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">Menu</span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {isMobileMenuOpen ? (
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <ul className="hidden md:flex gap-6 text-base font-light">
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={item.prefetch}
                className="text-zinc-900 transition-colors hover:text-zinc-600"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div
        id="mobile-nav-menu"
        className={`${isMobileMenuOpen ? "grid" : "hidden"} border-t border-zinc-200 bg-white px-4 pb-4 pt-3 md:hidden`}
      >
        <ul className="grid gap-2 text-base font-light">
          {NAV_LINKS.map((item) => (
            <li key={`mobile-${item.href}`}>
              <Link
                href={item.href}
                prefetch={item.prefetch}
                className="block rounded-md px-2 py-3 text-zinc-900 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
