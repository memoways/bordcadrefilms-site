import { type Director } from "../lib/catalog";
import DirectorCard from "./DirectorCard";

export default function DirectorGrid({
  directors,
  limit,
}: {
  directors: Director[];
  limit?: number;
}) {
  const sorted = [...directors].sort((a, b) => a.name.localeCompare(b.name));
  const displayed = limit ? sorted.slice(0, limit) : sorted;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 w-full">
      {displayed.map((director, index) => (
        <DirectorCard key={director.slug} director={director} priority={index < 5} />
      ))}
    </div>
  );
}
