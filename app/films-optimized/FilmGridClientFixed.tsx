"use client";
import { useMemo, useState } from "react";
import { type Film } from "../lib/airtable";
import FilmCardFixed from "./FilmCardFixed";
import FilmFilters, { type FilmFilterValues } from "../components/FilmFilters";

const PAGE_SIZE = 12;

function splitMultiValue(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,/|]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

const EMPTY_FILTERS: FilmFilterValues = { year: "", genre: "", country: "" };

export default function FilmGridClientFixed({
  films,
  limit,
  initialSearch = "",
}: { films: Film[]; limit?: number; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<FilmFilterValues>(EMPTY_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sourceFilms = useMemo(
    () => (limit ? films.slice(0, limit) : films),
    [films, limit],
  );

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          sourceFilms
            .map((f) => f.year?.trim())
            .filter(Boolean) as string[],
        ),
      ).sort((a, b) => b.localeCompare(a, "fr")),
    [sourceFilms],
  );

  const genres = useMemo(
    () =>
      Array.from(
        new Set(
          sourceFilms.flatMap((f) => splitMultiValue(f.genres)),
        ),
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [sourceFilms],
  );

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          sourceFilms.flatMap((f) => splitMultiValue(f.country)),
        ),
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [sourceFilms],
  );

  // Handlers qui resetent la pagination quand on change la recherche / les filtres
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (!limit) {
      setVisibleCount(PAGE_SIZE);
    }
  };

  const handleFiltersChange = (next: FilmFilterValues) => {
    setFilters(next);
    if (!limit) {
      setVisibleCount(PAGE_SIZE);
    }
  };

  const filtered = useMemo(() => {
    if (limit) return sourceFilms;

    const normalizedSearch = search.trim().toLowerCase();
    const selectedYear = filters.year.trim();
    const selectedGenre = filters.genre.trim().toLowerCase();
    const selectedCountry = filters.country.trim().toLowerCase();

    return sourceFilms.filter((film) => {
      const searchable = [
        film.title,
        film.director,
        film.country,
        film.genres,
        film.year,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesYear =
        !selectedYear || (film.year ?? "").trim() === selectedYear;

      const filmGenres = splitMultiValue(film.genres).map((v) =>
        v.toLowerCase(),
      );
      const filmCountries = splitMultiValue(film.country).map((v) =>
        v.toLowerCase(),
      );

      const matchesGenre =
        !selectedGenre || filmGenres.includes(selectedGenre);
      const matchesCountry =
        !selectedCountry || filmCountries.includes(selectedCountry);

      return (
        matchesSearch &&
        matchesYear &&
        matchesGenre &&
        matchesCountry
      );
    });
  }, [limit, search, filters, sourceFilms]);

  const displayed = useMemo(
    () => (limit ? filtered : filtered.slice(0, visibleCount)),
    [limit, filtered, visibleCount],
  );

  const hasMore = !limit && filtered.length > visibleCount;

  return (
    <div className="w-full">
      {!limit && (
        <div className="mb-10 rounded-2xl border border-zinc-200 bg-linear-to-b from-white to-zinc-50/70 p-4 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.45)] sm:p-6 transition-all duration-300">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Search and filters
            </p>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              {filtered.length} result{filtered.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="relative mb-5">
            <span
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-400"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search a film, a director, a genre..."
              className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-12 pr-12 text-zinc-900 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] placeholder:text-zinc-500 transition-all duration-200 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute inset-y-0 right-3 my-auto h-10 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                Clear
              </button>
            )}
          </div>

          <FilmFilters
            years={years}
            genres={genres}
            countries={countries}
            values={filters}
            onChange={handleFiltersChange}
          />
        </div>
      )}

      {displayed.length > 0 ? (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full">
            {displayed.map((film, idx) => (
              <FilmCardFixed
                key={film.slug || film.title || idx}
                film={film}
                priority={limit ? idx < limit : idx < PAGE_SIZE}
              />
            ))}
          </section>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((c) => c + PAGE_SIZE)
                }
                className="rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:border-zinc-400"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full text-center text-zinc-700 bg-zinc-100 p-4 rounded-lg">
          No films match the current filters.
        </div>
      )}
    </div>
  );
}