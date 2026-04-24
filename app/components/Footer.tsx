import Link from "next/link";
import { getSocialLinks } from "../lib/social";
import SocialIcon from "./SocialIcon";

const NAV_LINKS = [
  { label: "Films", href: "/completed-films" },
  { label: "Directors", href: "/directors" },
  { label: "About", href: "/about" },
];

const SUPPORT_LINKS = [
  { label: "Sitemap", href: "/sitemap" },
  { label: "Legal notice", href: "/legal" },
];

export default async function Footer() {
  const socialLinks = await getSocialLinks();

  return (
    <footer
      className="text-white py-16"
      style={{ backgroundColor: "#2B2B2B" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">

          {/* Col 1 — Brand + contact */}
          <div>
            <p className="font-bold text-sm uppercase tracking-widest mb-4">
              Bord Cadre films
            </p>
            <address className="not-italic text-white/70 text-sm leading-relaxed mb-6">
              CP 5353<br />
              1211 Genève 11
            </address>

            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="tel:+41794119387"
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="shrink-0 w-4 h-4" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                    <path d="M16 64C16 28.7 44.7 0 80 0H304c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H80c-35.3 0-64-28.7-64-64V64zM224 448a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM304 64H80V384H304V64z" />
                  </svg>
                  +41 79 411 93 87
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@bordcadrefilms.com"
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="shrink-0 w-4 h-4" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                    <path d="M64 208.1L256 65.9 448 208.1v47.4L289.5 373c-9.7 7.2-21.4 11-33.5 11s-23.8-3.9-33.5-11L64 255.5V208.1zM256 0c-12.1 0-23.8 3.9-33.5 11L25.9 156.7C9.6 168.8 0 187.8 0 208.1V448c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V208.1c0-20.3-9.6-39.4-25.9-51.4L289.5 11C279.8 3.9 268.1 0 256 0z" />
                  </svg>
                  info@bordcadrefilms.com
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2 — Navigation */}
          <div>
            <p className="font-bold text-sm uppercase tracking-widest mb-4">
              Navigation
            </p>
            <ul className="space-y-3">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Support links + Social */}
          <div>
            <p className="font-bold text-sm uppercase tracking-widest mb-4">
              Support links
            </p>
            <ul className="space-y-3 mb-8">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {socialLinks.length > 0 && (
              <>
                <p className="font-bold text-sm uppercase tracking-widest mb-4">
                  Follow us
                </p>
                <ul className="flex items-center gap-4">
                  {socialLinks.map(({ id, label, platform, url }) => (
                    <li key={id}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label || platform}
                        className="block p-2 -m-2 text-white/50 hover:text-white transition-colors"
                      >
                        <SocialIcon platform={platform} />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Bord Cadre Films. All rights reserved.</span>
          <span>Genève, Suisse</span>
        </div>
      </div>
    </footer>
  );
}
