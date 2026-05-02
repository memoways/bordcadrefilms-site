import Link from "next/link";
import { filmImageUrl, getValidImageUrl, safeExternalUrl } from "../lib/utils";
import { type Film } from "@/app/lib/airtable";
import GalleryCarousel from "./GalleryCarousel";
import SmartImage from "./SmartImage";
import FilmVideos from "./FilmVideos";
import FilmPress from "./FilmPress";

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

function parseDurationMinutes(value?: string): number | null {
  if (!value) return null;

  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  return Math.round(minutes);
}

function formatDurationLabel(value?: string): string {
  const totalMinutes = parseDurationMinutes(value);
  if (!totalMinutes) return "";

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes} min`;
  if (remainingMinutes === 0) return `${hours}m`;

  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}`;
}

type FilmographyEntry = { year?: number; title: string };

function parseFilmographyEntries(value?: string): FilmographyEntry[] {
  if (!value) return [];
  return value
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
    })
    .sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
}

export default function FilmDetail({ film }: { film: Film }) {
  const englishTitle = film.title || "";
  const title = film.originalTitle || englishTitle;
  const titleSubtitle = film.originalTitle && englishTitle && film.originalTitle !== englishTitle
    ? englishTitle
    : "";
  const directorName = film.director || "";
  const filmYear = film.year || "";
  const filmCountry = film.country || "";
  const filmAwards = film.awards || "";
  const filmImdb = safeExternalUrl(film.imdb) ?? "";
  const filmDuration = formatDurationLabel(film.duration);
  const posterUrl = filmImageUrl(film.slug, "poster", getValidImageUrl(film.poster));
  const directorImageUrl = filmImageUrl(film.slug, "profile", getValidImageUrl(film.profilePicture));
  const synopsis = film.synopsis || "";
  const directorWordsEnglish = film.directorWordsEnglish || "";
  const filmography = film.directorFilmography || "";
  const genres = splitList(film.genres);
  const awardsList = splitAwards(filmAwards);
  const recentFilmography = parseFilmographyEntries(filmography)
    .filter((e) => e.title.toLowerCase() !== title.toLowerCase())
    .slice(0, 3);
  const hasAwards = awardsList.length > 0;
  const festivalLogoUrl = filmImageUrl(film.slug, "festival", getValidImageUrl(film.festivalLogoUrl));
  const directorFilmsHref = directorName
    ? `/films?director=${encodeURIComponent(directorName)}`
    : "/films";

  // Poster is positioned absolutely on lg+ so the dark hero's height is
  // determined by the title block alone — letting the poster naturally extend
  // below the dark band into the white synopsis section. The hero reserves
  // left padding for the poster on lg+; the grid only lays out title + awards.
  // Poster sits at lg:left-4 (16px from outer edge — aligned with the Header
  // logo). The padding-left here reserves room for the 280px (lg) / 300px (xl)
  // poster + ~10px gap before the title block starts.
  const heroReservedClass = posterUrl ? "lg:pl-[306px] xl:pl-[346px]" : "";
  const heroGridClass = hasAwards
    ? "lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] xl:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]"
    : "lg:grid-cols-1";

  const videos = film.videos ?? [];
  const pressArticles = film.pressArticles ?? [];
  const pressKitUrl = safeExternalUrl(film.pressKitUrl);
  const hasPressBlock = pressArticles.length > 0 || Boolean(pressKitUrl);

  const detailRows = [
    { label: "Screenplay", value: film.crewDetails?.screenplay },
    { label: "Cinematography", value: film.crewDetails?.cinematography },
    { label: "Sound", value: film.crewDetails?.sound },
    { label: "Edit", value: film.crewDetails?.edit },
    { label: "Music", value: film.crewDetails?.music },
    { label: "Cast", value: film.crewDetails?.cast },
    { label: "Production Company", value: film.crewDetails?.productionCompany },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
  const hasInfoBox = detailRows.length > 0 || Boolean(filmImdb);
  const hasMainGrid = videos.length > 0 || hasPressBlock || synopsis || hasInfoBox;

  const galleryImages = (Array.isArray(film.images) ? film.images : [])
    .map((img: string, idx: number) => {
      const direct = getValidImageUrl(img);
      const url = filmImageUrl(film.slug, `image-${idx}`, direct);
      if (!url) return null;
      return { url, alt: `${title} - image ${idx + 1}` };
    })
    .filter(Boolean) as { url: string; alt: string }[];

  // Inline metadata line: Country  |  Year  |  Durée X:XX
  const metaParts: string[] = [
    filmCountry,
    filmYear,
    filmDuration ? `${filmDuration}` : "",
  ].filter(Boolean);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-zinc-50">

      {/* Responsive hero */}
      <section className="w-full overflow-visible bg-[#1C1C1C] text-white">
        <div className={`relative mx-auto max-w-6xl px-4 pb-12 pt-7 sm:pb-14 sm:pt-9 lg:min-h-[480px] lg:pb-10 lg:pt-12 ${heroReservedClass}`}>
          {posterUrl && (
            <div className="relative z-20 mx-auto mb-8 w-full max-w-70 sm:max-w-80 md:max-w-90 lg:absolute lg:left-4 lg:top-12 lg:mx-0 lg:mb-0 lg:w-[280px] xl:w-[300px]">
              <div className="relative aspect-2/3 overflow-hidden rounded-[10px] bg-zinc-200 shadow-[10px_10px_10px_#8E8E8E33]">
                <SmartImage
                  src={posterUrl}
                  alt={`Film poster — ${title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 639px) 78vw, (max-width: 767px) 68vw, (max-width: 1023px) 44vw, (max-width: 1279px) 30vw, 300px"
                  priority
                />
              </div>
            </div>
          )}

          <div className={`grid gap-8 lg:items-start lg:gap-6 xl:gap-8 ${heroGridClass}`}>
            <div className="flex min-w-0 w-full max-w-none flex-col gap-5 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl lg:leading-[1.05]">{title}</h1>
                  {titleSubtitle && (
                    <p className="text-base text-white/70 md:text-lg">{titleSubtitle}</p>
                  )}
                </div>
                {directorName && (
                  <p className="text-base text-white/80 md:text-lg">
                    directed by <span className="underline decoration-white/30 decoration-1 underline-offset-4">{directorName}</span>
                  </p>
                )}
                {metaParts.length > 0 && <p className="text-sm tracking-wide text-white/60">{metaParts.join("  |  ")}</p>  }
              </div>

                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
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
              </div>

            {hasAwards && (
              <aside className="mx-auto w-full max-w-75 self-start rounded-3xl border border-[#E0A75D]/70 bg-[#171717] p-5 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.8)] sm:p-6 lg:mr-0 lg:p-7">
                <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-[#F6DCA0] sm:tracking-[0.24em]">
                  Festivals &amp; Awards
                </p>
                {festivalLogoUrl && (
                  <div className="mb-5 flex justify-center">
                    <div className="relative h-20 w-20">
                      <SmartImage
                        src={festivalLogoUrl}
                        alt="Festival logo"
                        fill
                        sizes="80px"
                        className="object-contain"
                        skeletonClassName="bg-white/10 rounded-full"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-4 text-center text-sm leading-6 text-white/82 sm:space-y-5">
                  {awardsList.map((award, i) => (
                    <div key={`${award}-${i}`} className="space-y-3">
                      <p>{award}</p>
                      {i < awardsList.length - 1 && <div className="mx-auto h-px w-20 bg-white/15 sm:w-24" />}
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* ── Main content: vidéos+presse (left col) | synopsis+crew (right col) ── */}
      {hasMainGrid && (
        <section className="mx-auto mt-10 w-full max-w-6xl px-4 lg:mt-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">

            {/* Left column: Vidéos + La presse en parle */}
            {(videos.length > 0 || hasPressBlock) && (
              <div className="space-y-8">
                {videos.length > 0 && (
                  <div>
                    <div className="mb-6 flex items-center gap-4">
                      <span className="h-px flex-1 bg-zinc-300" aria-hidden />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">Videos</h3>
                      <span className="h-px flex-1 bg-zinc-300" aria-hidden />
                    </div>
                    <FilmVideos videos={videos} />
                  </div>
                )}
                {hasPressBlock && (
                  <div>
                    <div className="mb-6 flex items-center gap-4">
                      <span className="h-px flex-1 bg-zinc-300" aria-hidden />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">Press</h3>
                      <span className="h-px flex-1 bg-zinc-300" aria-hidden />
                    </div>
                    <FilmPress articles={pressArticles} pressKitUrl={pressKitUrl} />
                  </div>
                )}
              </div>
            )}

            {/* Right column: Synopsis + details */}
            {(synopsis || hasInfoBox) && (
              <div className="w-full max-w-4xl space-y-8 lg:col-start-2">
                {synopsis && (
                  <div>
                    <h3 className="mb-3 border-b border-zinc-200 pb-2 text-xl font-bold text-zinc-900">Synopsis</h3>
                    <p className="leading-relaxed text-zinc-700">{synopsis}</p>
                  </div>
                )}

                {hasInfoBox && (
                  <div className="rounded-2xl bg-[#F4F4F4] p-5 sm:p-6 md:p-8">
                    {detailRows.length > 0 && (
                      <dl className="space-y-1.5 text-sm text-zinc-700">
                        {detailRows.map((row) => (
                          <div key={row.label} className="flex gap-1">
                            <dt className="shrink-0 font-semibold text-zinc-900">{row.label}:</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {filmImdb && (
                      <div className={detailRows.length > 0 ? "mt-5" : ""}>
                        <a
                          href={filmImdb}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded px-3 py-1 text-sm font-bold text-black"
                          style={{ backgroundColor: "#F5C518" }}
                        >
                          IMDb
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {galleryImages.length > 0 && (
        <section className="mt-10 bg-[#1C1C1C] py-10 lg:mt-12 lg:py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h3 className="mb-4 border-b border-white/20 pb-2 text-xl font-bold text-white">Gallery</h3>
            <GalleryCarousel images={galleryImages} title={title} />
          </div>
        </section>
      )}

      {/* ── Director section ── */}
      {(directorImageUrl || directorName || recentFilmography.length > 0 || directorWordsEnglish) && (
        <section className="bg-[#DEDEDE] py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

              {/* Left col — avatar + name + filmography card */}
              <div className="flex w-full max-w-70 shrink-0 flex-col items-center gap-4">
                <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-white/60 bg-zinc-300 shadow-md">
                  {directorImageUrl && (
                    <SmartImage
                      src={directorImageUrl}
                      alt={directorName || "Director"}
                      fill
                      sizes="144px"
                      className="object-cover"
                      skeletonClassName="bg-zinc-300"
                    />
                  )}
                </div>
                {directorName && (
                  <h3 className="text-center text-lg font-semibold text-zinc-900">{directorName}</h3>
                )}
                {recentFilmography.length > 0 && (
                  <div className="h-50 w-full overflow-hidden rounded-[10px] bg-[#FFFFFFCC] px-5 py-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-900">Filmography</span>
                      <span className="h-px flex-1 bg-[#C0392B]" />
                    </div>
                    <ul className="space-y-1.5 text-sm text-zinc-800">
                      {recentFilmography.map((entry, idx) => (
                        <li key={`${entry.title}-${idx}`} className="flex gap-2 leading-snug">
                          <span className="shrink-0 text-zinc-400">-</span>
                          {entry.year && <span className="shrink-0 text-zinc-500">{entry.year}</span>}
                          <span className="truncate">{entry.title}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={directorFilmsHref}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-zinc-900 hover:underline"
                    >
                      All films <span aria-hidden>→</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Right col — director's words */}
              {directorWordsEnglish && (
                <div className="min-w-0 flex-1">
                  <h4 className="mb-4 text-xl font-bold text-zinc-900">Director&apos;s statement</h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{directorWordsEnglish}</p>
                  {directorName && (
                    <p className="mt-5 text-sm font-bold text-zinc-900">{directorName}</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>
      )}
    </div>
  );
}
