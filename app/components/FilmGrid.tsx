import { type Film } from "../lib/airtable";
import FilmGridClient from "./FilmGridClient";

export default function FilmGrid({ films, limit, initialSearch }: { films: Film[]; limit?: number; initialSearch?: string }) {
  if (!films || films.length === 0) {
    return (
      <div className="w-full text-center text-zinc-700 bg-zinc-100 p-4 rounded-lg">
        No films found. Check the Airtable connection or environment variables.
      </div>
    );
  }

  return <FilmGridClient films={films} limit={limit} initialSearch={initialSearch} />;
}
