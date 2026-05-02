"use client";

export type FilmFilterValues = {
  year: string;
  genre: string;
  country: string;
};

export type FilmFiltersProps = {
  years: string[];
  genres: string[];
  countries: string[];
  values: FilmFilterValues;
  onChange: (filters: FilmFilterValues) => void;
};

const selectClass =
  "h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-none transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300";

export default function FilmFilters({ years, genres, countries, values, onChange }: FilmFiltersProps) {
  function set(key: keyof FilmFilterValues, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <label className="block">
        <span className="sr-only">Year</span>
        <select value={values.year} onChange={(e) => set("year", e.target.value)} className={selectClass}>
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Genre</span>
        <select value={values.genre} onChange={(e) => set("genre", e.target.value)} className={selectClass}>
          <option value="">Genre</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Country</span>
        <select value={values.country} onChange={(e) => set("country", e.target.value)} className={selectClass}>
          <option value="">Country</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
    </form>
  );
}
