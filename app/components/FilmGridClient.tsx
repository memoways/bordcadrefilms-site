"use client";
import { useMemo, useState } from "react";
import { type Film } from "../lib/airtable";
import FilmCard from "./FilmCard";
import FilmFilters, { type FilmFilterValues } from "./FilmFilters";

const PAGE_SIZE = 12;

function splitMultiValue(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,/|]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

const EMPTY_FILTERS: FilmFilterValues = { year: "", genre: "", country: "" };

export default function FilmGridClient({
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
  const hasActiveControls = Boolean(
    search.trim() || filters.year || filters.genre || filters.country,
  );

  const resetControls = () => {
    setSearch("");
    handleFiltersChange(EMPTY_FILTERS);
  };

  return (
    <div className="w-full">
      {!limit && (
        <div className="mb-7 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
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
                placeholder="Search films"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 shadow-none placeholder:text-zinc-400 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:shrink-0">
              <FilmFilters
                years={years}
                genres={genres}
                countries={countries}
                values={filters}
                onChange={handleFiltersChange}
              />
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <span className="whitespace-nowrap text-xs text-zinc-500">
                  {filtered.length} result{filtered.length > 1 ? "s" : ""}
                </span>
                {hasActiveControls && (
                  <button
                    type="button"
                    onClick={resetControls}
                    className="h-8 rounded-md px-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {displayed.length > 0 ? (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full">
            {displayed.map((film, idx) => {
              const isEager = idx < visibleCount;
              return (
                <FilmCard
                  key={film.slug || film.title || idx}
                  film={film}
                  priority={isEager}
                  loading={isEager ? "eager" : "lazy"}
                />
              );
            })}
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
