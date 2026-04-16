import Image from "next/image";
import Link from "next/link";
import { type Director } from "../lib/catalog";
import { getValidImageUrl } from "../lib/utils";

export default function DirectorCard({ director, showBio = true, priority = false }: { director: Director; showBio?: boolean; priority?: boolean }) {
  const imgUrl = getValidImageUrl(director.profilePicture);
  return (
    <Link
      href={`/directors/${director.slug}`}
      prefetch
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
    >
      <article className="bg-white rounded-lg border border-zinc-200 shadow-md overflow-hidden flex flex-col items-center p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative w-32 h-32 mb-4">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={director.name}
              fill
              className="object-cover rounded-full"
              sizes="128px"
              priority={priority}
            />
          ) : (
            <div className="w-32 h-32 bg-zinc-100 flex items-center justify-center text-zinc-500 rounded-full">
              No image
            </div>
          )}
        </div>
        <h2 className="text-lg font-medium text-zinc-900 group-hover:text-zinc-700">{director.name}</h2>
        {showBio && <p className="text-zinc-600 text-sm text-center mt-2 font-light">{director.bio}</p>}
      </article>
    </Link>
  );
}
