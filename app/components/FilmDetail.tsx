import Image from "next/image";
import Link from "next/link";
import { getValidImageUrl } from "../lib/utils";
import { type Film } from "../lib/airtable";

function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,/|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitAwards(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[\n•|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDuration(value?: string): string {
  if (!value) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  const hours = Math.floor(num / 60);
  const minutes = num % 60;
  if (hours <= 0) return `${num} min`;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

type FilmographyEntry = { year?: number; title: string };

function parseFilmographyEntries(value?: string): FilmographyEntry[] {
  if (!value) return [];

  const entries = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleanLine = line.replace(/^[-*•]\s*/, "").trim();
      const yearMatch = cleanLine.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? Number(yearMatch[0]) : undefined;
      const title = yearMatch
        ? cleanLine.replace(yearMatch[0], "").replace(/^[-–—:\s]+/, "").trim() || cleanLine
        : cleanLine;

      return { year, title };
    });

  return entries.sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
}

export default function FilmDetail({ film }: { film: Film }) {
  const title = film.title || "";
  const directorName = film.director || "";
  const filmYear = film.year || "";
  const filmCountry = film.country || "";
  const filmAwards = film.awards || "";
  const filmImdb = film.imdb || "";
  const filmDuration = formatDuration(film.duration);
  const posterUrl = getValidImageUrl(film.poster);
  const directorImageUrl = getValidImageUrl(film.profilePicture);
  const tagline = film.tagline || "";
  const directorWordsEnglish = film.directorWordsEnglish || "";
  const directorBio = film.bio || "";
  const filmography = film.directorFilmography || "";
  const team = film.team || "";
  const genres = splitList(film.genres);
  const awardsList = splitAwards(filmAwards);
  const recentFilmography = parseFilmographyEntries(filmography).slice(0, 3);
  const hasAwards = awardsList.length > 0;
  const hasDirectorWordsSection = Boolean(directorWordsEnglish || directorName || directorImageUrl || directorBio || team || recentFilmography.length);
  const directorFilmsHref = directorName ? `/completed-films?director=${encodeURIComponent(directorName)}` : "/completed-films";
  const heroGridClass = posterUrl
    ? hasAwards
      ? "lg:grid-cols-[320px_minmax(0,1fr)_360px]"
      : "lg:grid-cols-[320px_minmax(0,1fr)]"
    : hasAwards
      ? "lg:grid-cols-[minmax(0,1fr)_360px]"
      : "lg:grid-cols-[minmax(0,1fr)]";

  const galleryImages = (Array.isArray(film.images) ? film.images : [])
    .map((img, idx) => {
      const url = getValidImageUrl(img);
      if (!url) return null;
      return { url, alt: `${title} - image ${idx + 1}` };
    })
    .filter(Boolean) as { url: string; alt: string }[];

  if (process.env.NODE_ENV !== "production") {
    console.log("[FilmDetail] raw film data", JSON.stringify(film, null, 2));
    console.log(
      "[FilmDetail] derived film data",
      JSON.stringify(
        {
          title,
          directorName,
          filmYear,
          filmCountry,
          filmAwards,
          filmImdb,
          filmDuration,
          tagline,
          directorWordsEnglish,
          directorBio,
          team,
          genres,
          filmography,
          recentFilmography,
          posterUrl,
          directorImageUrl,
          galleryImages,
        },
        null,
        2
      )
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 pb-16">
      <section className="w-full overflow-visible border-b border-white/10 bg-[#1C1C1C] text-white" style={{ height: 457 }}>
        <div
          className={`mx-auto grid h-full w-full grid-cols-1 gap-10 px-4 pl-75 pt-15 lg:items-start ${heroGridClass}`}
          style={{ maxWidth: 1950 }}
        >
          {posterUrl && (
            <div className="translate-y-15 overflow-hidden rounded-2xl border border-white/10 bg-zinc-100 shadow-[0_28px_72px_-36px_rgba(0,0,0,0.72)]">
              <Image
                src={posterUrl}
                alt={`Affiche du film ${title}`}
                width={320}
                height={480}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-5">
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-[0.24em] text-white/70 uppercase">Fiche film</p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] text-white md:text-5xl lg:text-6xl">{title}</h1>
              {directorName && (
                <p className="text-lg text-white/80">
                  Réalisé par <span className="underline decoration-white/30 decoration-1 underline-offset-4">{directorName}</span>
                </p>
              )}
              {(filmCountry || filmYear || filmDuration) && (
                <p className="text-sm tracking-wide text-white/70">
                  {[filmCountry, filmYear, filmDuration].filter(Boolean).join("  |  ")}
                </p>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-md border border-[#E0A75D]/45 bg-[#E0A75D]/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#F6DCA0]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {tagline && (
              <div className="max-w-4xl border-l-2 border-[#E0A75D] pl-5 pt-2">
                <p className="text-[1.08rem] leading-[1.55] text-white/92 md:text-[1.12rem]">{tagline}</p>
              </div>
            )}

            {filmImdb && (
              <div>
                <a
                  href={filmImdb}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-white/20 bg-white/8 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/12"
                >
                  Voir sur IMDb
                </a>
              </div>
            )}
          </div>

          {hasAwards && (
            <aside className="rounded-[1.75rem] border border-[#E0A75D]/70 bg-[#171717] p-6 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.8)]">
              <div className="mb-5 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#F6DCA0]">Festivals &amp; Récompenses</p>
              </div>

              <div className="space-y-4 text-center text-sm leading-6 text-white/82">
                {awardsList.map((award, index) => (
                  <div key={`${award}-${index}`} className="space-y-3">
                    <p>{award}</p>
                    {index < awardsList.length - 1 && <div className="mx-auto h-px w-24 bg-white/15" />}
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>

      {galleryImages.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-4 pl-75">
          <h3 className="mb-4 text-2xl font-bold text-zinc-900">Galerie</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((img) => (
              <div key={img.url} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <Image src={img.url} alt={img.alt} width={640} height={400} className="h-56 w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {hasDirectorWordsSection && (
        <section className="mt-10 bg-[#DEDEDE] py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="space-y-8">
              <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-start lg:gap-8">
                {directorImageUrl && (
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-zinc-300 bg-white">
                    <Image src={directorImageUrl} alt={directorName || "Director"} width={112} height={112} className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="min-w-0 space-y-3">
                  {directorName && <h3 className="text-xl font-semibold text-zinc-900">{directorName}</h3>}

                  {directorWordsEnglish && (
                    <div className="max-w-4xl">
                      <h4 className="mb-2 text-2xl font-bold text-zinc-900">Director&apos;s words</h4>
                      <p className="whitespace-pre-line text-zinc-700 leading-relaxed">{directorWordsEnglish}</p>
                    </div>
                  )}

                  {team && (
                    <div className="text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-900">Equipe:</span> {team}
                    </div>
                  )}
                </div>
              </div>


              {recentFilmography.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-zinc-900">Filmographie</p>
                  <ul className="space-y-2 text-sm text-zinc-700">
                    {recentFilmography.map((entry, idx) => (
                      <li key={`${entry.title}-${idx}`} className="leading-relaxed">
                        {entry.year ? `${entry.year}  ` : ""}
                        {entry.title}
                      </li>
                    ))}
                  </ul>
                  <Link href={directorFilmsHref} className="mt-3 inline-block text-sm font-semibold text-zinc-900 underline underline-offset-4">
                    Tous les films
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
