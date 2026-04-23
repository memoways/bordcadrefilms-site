import Link from "next/link";

const NAV_LINKS = [
  { label: "Films", href: "/completed-films" },
  { label: "Directors", href: "/directors" },
  { label: "About", href: "/about" },
];

const SUPPORT_LINKS = [
  { label: "Sitemap", href: "/sitemap" },
  { label: "Legal notice", href: "/legal" },
];

const SOCIAL_LINKS = [
  {
    label: "YouTube",
    href: "https://twitter.com/",
    icon: (
      <svg width="32" height="32" viewBox="0 0 128 128" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M64 4C97.1371 4 124 30.8629 124 64C124 97.1371 97.1371 124 64 124C30.8629 124 4 97.1371 4 64C4 30.8629 30.8629 4 64 4ZM128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128C99.3462 128 128 99.3462 128 64ZM98.3474 34.9375C102.048 35.9062 105.104 38.974 106.069 42.849C108 49.6302 108 64.1615 108 64.1615C108 64.1615 108 78.5312 106.069 85.474C105.104 89.349 102.048 92.2552 98.3474 93.224C91.4296 95 64.0804 95 64.0804 95C64.0804 95 36.5704 95 29.6527 93.224C25.9525 92.2552 22.8958 89.349 21.9305 85.474C20 78.5312 20 64.1615 20 64.1615C20 64.1615 20 49.6302 21.9305 42.849C22.8958 38.974 25.9525 35.9062 29.6527 34.9375C36.5704 33 64.0804 33 64.0804 33C64.0804 33 91.4296 33 98.3474 34.9375ZM55.0713 51.0833V77.2396L77.9159 64.1615L55.0713 51.0833Z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/",
    icon: (
      <svg width="32" height="32" viewBox="0 0 128 128" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M64 4C97.1371 4 124 30.8629 124 64C124 97.1371 97.1371 124 64 124C30.8629 124 4 97.1371 4 64C4 30.8629 30.8629 4 64 4ZM128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128C99.3462 128 128 99.3462 128 64ZM42.9643 51.1633V102H27.1875V51.1633H42.9643ZM44.1518 35.0112C44.1518 40.1119 40.0804 44.3624 34.9911 44.3624C30.0714 44.3624 26 40.1119 26 35.0112C26 30.0805 30.0714 26 34.9911 26C40.0804 26 44.1518 30.0805 44.1518 35.0112ZM102 102H101.83H86.2232V77.3468C86.2232 71.396 86.0536 63.915 77.9107 63.915C69.7679 63.915 68.5804 70.2058 68.5804 76.8367V102H52.8036V51.1633H67.9018V58.1342H68.0714C70.2768 54.2237 75.3661 49.9732 83 49.9732C98.9464 49.9732 102 60.5145 102 74.1163V102Z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/",
    icon: (
      <svg width="32" height="32" viewBox="0 0 128 128" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M64 4C97.1371 4 124 30.8629 124 64C124 94.0568 101.899 118.952 73.0618 123.32V83.2163H88.3345L91.1855 64.6194H73.0618V52.491C73.0618 47.2354 75.5055 42.384 83.6509 42.384H92V26.415C92 26.415 84.4655 25 77.3382 25C62.4727 25 52.6982 34.0963 52.6982 50.2675V64.6194H36V83.2163H52.6982V122.937C24.9642 117.651 4 93.2737 4 64C4 30.8629 30.8629 4 64 4ZM63.1728 127.995C28.2078 127.552 0 99.0701 0 64C0 28.6538 28.6538 0 64 0C99.3462 0 128 28.6538 128 64C128 98.9234 100.028 127.314 65.2655 127.988C64.8447 127.996 64.4228 128 64 128C63.7239 128 63.4481 127.998 63.1728 127.995Z" />
      </svg>
    ),
  },
];

export default function Footer() {
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

            <p className="font-bold text-sm uppercase tracking-widest mb-4">
              Follow us
            </p>
            <ul className="flex items-center gap-4">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="block p-2 -m-2 text-white/50 hover:text-white transition-colors"
                  >
                    {icon}
                  </a>
                </li>
              ))}
            </ul>
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
