"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SocialIcon from "./SocialIcon";

type SocialLink = {
  id: string;
  label: string;
  platform: string;
  url: string;
};

export default function SocialLinksClient() {
  const pathname = usePathname();
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    let active = true;

    async function loadLinks() {
      try {
        const res = await fetch("/api/social", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SocialLink[];
        if (active) setLinks(data);
      } catch {
        // swallow - footer is decorative
      }
    }

    loadLinks();
    return () => {
      active = false;
    };
  }, [pathname]);

  if (links.length === 0) return null;

  return (
    <>
      <p className="font-bold text-sm uppercase tracking-widest mb-4">
        Follow us
      </p>
      <ul className="flex items-center gap-4">
        {links.map(({ id, label, platform, url }) => (
          <li key={id}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label || platform}
              className="block p-2 -m-2 text-white/50 hover:text-white transition-colors"
            >
              <SocialIcon platform={platform as any} />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
