import { type Director } from "../lib/catalog";
import DirectorCard from "./DirectorCard";

export default function DirectorGrid({ directors, limit }: { directors: Director[]; limit?: number }) {
  const displayed = limit ? directors.slice(0, limit) : directors;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
      {displayed.map((director) => (
        <DirectorCard key={director.name} director={director} />
      ))}
    </section>
  );
}
