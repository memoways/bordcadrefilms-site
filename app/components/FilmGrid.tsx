import { type Film } from "../lib/airtable";
import FilmGridClient from "./FilmGridClient";

export default function FilmGridFixed({ films, limit, initialSearch }: { films: Film[]; limit?: number; initialSearch?: string }) {
  if (!films || films.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-[0_10px_28px_-22px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-5 inline-flex items-center gap-1.5" aria-hidden>
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900">Catalogue refreshing</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
          Our films will be back in a moment. Refresh the page if this persists.
        </p>
      </div>
    );
  }

  return <FilmGridClient films={films} limit={limit} initialSearch={initialSearch} />;
}
