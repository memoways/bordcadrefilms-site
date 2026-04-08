"use client";
import { useMemo, useState } from "react";
import { type Film } from "../lib/airtable";
import FilmCard from "./FilmCard";
import FilmFilters, { type FilmFilterValues } from "./FilmFilters";

function splitMultiValue(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,/|]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

const EMPTY_FILTERS: FilmFilterValues = { year: "", genre: "", country: "" };

export default function FilmGridClient({ films, limit, initialSearch = "" }: { films: Film[]; limit?: number; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<FilmFilterValues>(EMPTY_FILTERS);

  const sourceFilms = useMemo(() => (limit ? films.slice(0, limit) : films), [films, limit]);

  const years = useMemo(
    () =>
      Array.from(new Set(sourceFilms.map((f) => f.year?.trim()).filter(Boolean) as string[])).sort(
        (a, b) => b.localeCompare(a, "fr")
      ),
    [sourceFilms]
  );

  const genres = useMemo(
    () =>
      Array.from(new Set(sourceFilms.flatMap((f) => splitMultiValue(f.genres)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [sourceFilms]
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(sourceFilms.flatMap((f) => splitMultiValue(f.country)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [sourceFilms]
  );

  const displayed = useMemo(() => {
    if (limit) return sourceFilms;

    const normalizedSearch = search.trim().toLowerCase();
    const selectedYear = filters.year.trim();
    const selectedGenre = filters.genre.trim().toLowerCase();
    const selectedCountry = filters.country.trim().toLowerCase();

    return sourceFilms.filter((film) => {
      const searchable = [film.title, film.director, film.country, film.genres, film.year]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesYear = !selectedYear || (film.year ?? "").trim() === selectedYear;

      const filmGenres = splitMultiValue(film.genres).map((v) => v.toLowerCase());
      const filmCountries = splitMultiValue(film.country).map((v) => v.toLowerCase());

      const matchesGenre = !selectedGenre || filmGenres.includes(selectedGenre);
      const matchesCountry = !selectedCountry || filmCountries.includes(selectedCountry);

      return matchesSearch && matchesYear && matchesGenre && matchesCountry;
    });
  }, [limit, search, filters, sourceFilms]);

  return (
    <div className="w-full">
      {!limit && (
        <div className="mb-10 rounded-2xl border border-zinc-200 bg-linear-to-b from-white to-zinc-50/70 p-4 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.45)] sm:p-6 transition-all duration-300">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Recherche et filtres</p>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              {displayed.length} resultat{displayed.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="relative mb-5">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-400" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un film, un realisateur, un genre..."
              className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-12 pr-12 text-zinc-900 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] placeholder:text-zinc-500 transition-all duration-200 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-3 my-auto h-8 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                Effacer
              </button>
            )}
          </div>

          <FilmFilters
            years={years}
            genres={genres}
            countries={countries}
            values={filters}
            onChange={setFilters}
          />
        </div>
      )}

      {displayed.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
          {displayed.map((film, idx) => (
            <FilmCard key={film.slug || film.title || idx} film={film} />
          ))}
        </section>
      ) : (
        <div className="w-full text-center text-zinc-700 bg-zinc-100 p-4 rounded-lg">
          Aucun film ne correspond aux filtres.
        </div>
      )}
    </div>
  );
}
