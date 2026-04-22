import Image from "next/image";
import Link from "next/link";
import { type Director } from "../lib/catalog";
import { getValidImageUrl } from "../lib/utils";

export default function DirectorCard({ director, priority = false }: { director: Director; priority?: boolean }) {
  const imgUrl = getValidImageUrl(director.profilePicture);
  return (
    <Link
      href={`/directors/${director.slug}`}
      prefetch
      className="flex flex-col items-center gap-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
    >
      <div className="relative w-36 h-44 overflow-hidden rounded-full border border-zinc-200">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={director.name}
            fill
            className="object-cover"
            sizes="144px"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs">
            No photo
          </div>
        )}
      </div>
      <h2 className="mt-5 text-xl font-normal text-center text-zinc-900 px-5 leading-snug">{director.name}</h2>
      {director.country && (
        <span className="mt-4 px-2 py-0.5 text-sm bg-zinc-100 rounded text-zinc-700">
          {director.country}
        </span>
      )}
    </Link>
  );
}
