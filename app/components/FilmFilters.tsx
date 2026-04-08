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
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-800 shadow-[0_1px_0_0_rgba(0,0,0,0.02)] transition-all duration-200 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

export default function FilmFilters({ years, genres, countries, values, onChange }: FilmFiltersProps) {
  function set(key: keyof FilmFilterValues, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Annee</span>
        <select value={values.year} onChange={(e) => set("year", e.target.value)} className={selectClass}>
          <option value="">Toutes</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Genre</span>
        <select value={values.genre} onChange={(e) => set("genre", e.target.value)} className={selectClass}>
          <option value="">Tous</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Pays</span>
        <select value={values.country} onChange={(e) => set("country", e.target.value)} className={selectClass}>
          <option value="">Tous</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <button
        type="button"
        onClick={() => onChange({ year: "", genre: "", country: "" })}
        className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
      >
        Reinitialiser
      </button>
    </form>
  );
}
