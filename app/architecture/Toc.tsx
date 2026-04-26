"use client";

import { useEffect, useState } from "react";

type Section = { id: string; label: string };

export default function Toc({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 lg:block"
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Sections
      </p>
      <ol className="space-y-1.5">
        {sections.map(({ id, label }, i) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${id}`);
                }
              }}
              className={`group flex items-baseline gap-3 rounded-md py-1.5 pl-3 pr-2 text-sm transition-colors ${
                active === id
                  ? "bg-[#E0A75D]/12 text-zinc-900 font-medium"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <span
                className={`shrink-0 font-mono text-[10px] tabular-nums ${
                  active === id ? "text-[#E0A75D]" : "text-zinc-400"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">{label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
