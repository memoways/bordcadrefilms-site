import Image from "next/image";
import Link from "next/link";
import { getValidImageUrl, slugify } from "../lib/utils";
import type { Film } from "../lib/airtable";

export default function FilmCard({ film, priority = false }: { film: Film; priority?: boolean }) {
  const imgUrl = getValidImageUrl(film.poster);
  // Always generate a fallback slug from title if missing
  const filmSlug = film.slug || (film.title ? slugify(film.title) : undefined);
  const filmUrl = filmSlug ? `/completed-films/${filmSlug}` : undefined;
  const altText = film.title ? `Film poster — ${film.title}` : "Film poster";
  const CardContent = (
    <article
      className={`bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col transition-all duration-200 ${filmUrl ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "opacity-70 cursor-default"}`}
      tabIndex={filmUrl ? 0 : -1}
    >
      <div className="relative w-full aspect-2/3 bg-zinc-100">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={altText}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
            style={{ objectFit: "contain", background: "#f4f4f5" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">No image</div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h2 className="text-base font-medium text-zinc-900 mb-0.5 truncate" title={film.title}>{film.title}</h2>
        <p className="text-zinc-500 text-sm font-light truncate">{film.director || ""}</p>
      </div>
    </article>
  );
  return filmUrl ? (
    <Link href={filmUrl} prefetch={true} tabIndex={0} aria-label={`View film details — ${film.title}`} className="block focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded-xl">
      {CardContent}
    </Link>
  ) : (
    CardContent
  );
}
