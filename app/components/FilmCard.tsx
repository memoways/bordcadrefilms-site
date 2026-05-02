import Link from "next/link";
import { filmImageUrl, getValidImageUrl, slugify, shimmer, toBase64 } from "../lib/utils";
import type { Film } from "../lib/airtable";
import SmartImage from "./SmartImage";

export default function FilmCard({ 
  film, 
  priority = false,
  loading = "lazy" 
}: { 
  film: Film; 
  priority?: boolean;
  loading?: "eager" | "lazy";
}) {
  // Always generate a fallback slug from title if missing
  const filmSlug = film.slug || (film.title ? slugify(film.title) : undefined);
  const filmUrl = filmSlug ? `/films/${filmSlug}` : undefined;
  const direct = getValidImageUrl(film.poster);
  const imgUrl = filmSlug ? filmImageUrl(filmSlug, "poster", direct) : direct;
  const altText = film.title ? `Film poster — ${film.title}` : "Film poster";

  const CardContent = (
    <article
      className={`bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col transition-all duration-200 ${filmUrl ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "opacity-70 cursor-default"}`}
      tabIndex={filmUrl ? 0 : -1}
    >
      <div className="overflow-hidden relative w-full aspect-2/3 bg-zinc-100">
        {imgUrl ? (
          <SmartImage
            key={imgUrl}
            src={imgUrl}
            alt={altText}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            priority={priority}
            loading={loading}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(320, 480))}`}
            style={{ objectFit: "cover", background: "#f4f4f5" }}
            skeletonClassName="bg-linear-to-b from-zinc-100 via-zinc-200/70 to-zinc-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">No image</div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-0.5">
        <h2 className="text-base font-medium text-zinc-900 mb-0" title={film.title}>{film.title}</h2>
        <div className="flex flex-col gap-0">
          {(film.originalTitle && film.originalTitle !== film.title) && (
            <p className="text-red-600 text-[10px] uppercase font-bold tracking-wider leading-tight truncate">
              {film.originalTitle}
            </p>
          )}
          <p className="text-zinc-500 text-sm font-light truncate">
            {film.director || ""}
            {film.country && <span className="text-zinc-400 text-xs ml-1.5 border-l border-zinc-200 pl-1.5">{film.country}</span>}
          </p>
        </div>
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
