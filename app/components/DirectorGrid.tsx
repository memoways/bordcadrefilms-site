import { type Director } from "../lib/catalog";
import DirectorCard from "./DirectorCard";

export default function DirectorGrid({
  directors,
  limit,
  showBio = true,
}: {
  directors: Director[];
  limit?: number;
  showBio?: boolean;
}) {
  const displayed = limit ? directors.slice(0, limit) : directors;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
      {displayed.map((director, index) => (
        <DirectorCard key={director.slug} director={director} showBio={showBio} priority={index === 0} />
      ))}
    </section>
  );
}
