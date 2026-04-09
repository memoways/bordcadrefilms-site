import Link from "next/link";
import { type Film } from "../lib/airtable";
import FilmGrid from "./FilmGrid";

export default function HomeFilmGridPreview({ films }: { films: Film[] }) {

  return (
    <section className="w-full py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-zinc-900">Films produits</h2>
        <FilmGrid films={films} limit={6} />
        <div className="flex justify-center mt-4">
          <Link href="/completed-films" prefetch className="px-6 py-2 rounded-lg brand-btn-primary font-normal transition-all duration-150 shadow-sm">
            Voir tous les films
          </Link>
        </div>
      </div>
    </section>
  );
}
