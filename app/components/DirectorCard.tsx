import Image from "next/image";
import { type Director } from "../lib/catalog";
import { getValidImageUrl } from "../lib/utils";

export default function DirectorCard({ director }: { director: Director }) {
  const imgUrl = getValidImageUrl(director.profilePicture);
  return (
    <article className="bg-white rounded-lg border border-zinc-200 shadow-md overflow-hidden flex flex-col items-center p-6">
      <div className="relative w-32 h-32 mb-4">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={`Photo de ${director.name}`}
            fill
            className="object-cover rounded-full"
            sizes="128px"
            priority
          />
        ) : (
          <div className="w-32 h-32 bg-zinc-100 flex items-center justify-center text-zinc-500 rounded-full">
            No image
          </div>
        )}
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">{director.name}</h2>
      <p className="text-zinc-600 text-sm text-center mt-2">{director.bio}</p>
    </article>
  );
}
