import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-zinc-200 shadow-sm sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="https://cdn.cmsfly.com/65f94adfe0dc7a0012ede758/images/logobcfB-0kS11.svg"
            alt="Logo Bord Cadre Films"
            width={120}
            height={50}
            className="h-8 w-auto transition-opacity group-hover:opacity-80"
            priority
          />
        </Link>
        <ul className="flex gap-6 text-base font-light">
          <li><Link href="/" className="text-zinc-900 transition-colors hover:text-zinc-600">Accueil</Link></li>
          <li><Link href="/news" prefetch className="text-zinc-900 transition-colors hover:text-zinc-600">News</Link></li>
          <li><Link href="/completed-films" prefetch className="text-zinc-900 transition-colors hover:text-zinc-600">Films</Link></li>
          <li><Link href="/directors" prefetch className="text-zinc-900 transition-colors hover:text-zinc-600">Réalisateurs</Link></li>
          <li><Link href="/contact" className="text-zinc-900 transition-colors hover:text-zinc-600">Contact</Link></li>
        </ul>
      </nav>
    </header>
  );
}
