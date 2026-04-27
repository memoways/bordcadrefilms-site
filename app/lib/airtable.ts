import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { slugify, firstString, getValidImageUrl } from './utils';

const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME!;
const VIEW_NAME = process.env.AIRTABLE_VIEW_NAME!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

// IDs des deux autres tables de la même base (synchronisées, pas de vue custom).
const SYNC_LINKS_TABLE_ID = 'tblUeAy7N0myD5HkR';
const SYNC_MEDIA_TABLE_ID = 'tblRM4z90LYZcy5Tv';

export type FilmVideo = {
  title: string;
  url: string;
  thumbnail?: string;
  type?: 'trailer' | 'teaser' | 'interview' | 'clip' | 'film';
  language?: string;
};

export type PressArticle = {
  title: string;
  url?: string;
  source?: string;
};

export type Film = {
  slug: string;
  title: string;
  tagline?: string;
  directorWordsEnglish?: string;
  director?: string;
  synopsis?: string;
  bio?: string;
  poster?: string;
  profilePicture?: string;
  year?: string;
  genres?: string;
  country?: string;
  status?: string;
  publish?: string;
  category?: string;
  awards?: string;
  imdb?: string;
  team?: string;
  images?: string[];
  directorStatement?: string;
  filmography?: string;
  directorFilmography?: string;
  duration?: string;
  nations?: string;
  quoteEN?: string;
  quoteFR?: string;
  festivalLogoUrl?: string;
  crewComplete?: string;
  production?: string[];
  coproduction?: string[];
  premiereDate?: string;
  mainUrl?: string;
  videos?: FilmVideo[];
  pressArticles?: PressArticle[];
  pressKitUrl?: string;
};

type AirtableFieldMap = Record<string, unknown>;
export type AirtableRecord = { id?: string; fields: AirtableFieldMap };

function collectTextValues(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTextValues(item));
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const directText = record.title ?? record.name ?? record.value ?? record.label ?? record.text;

    if (typeof directText === 'string' || typeof directText === 'number' || typeof directText === 'boolean') {
      return collectTextValues(directText);
    }

    if (record.fields && typeof record.fields === 'object') {
      return collectTextValues(Object.values(record.fields));
    }

    return Object.values(record).flatMap((item) => collectTextValues(item));
  }

  return [];
}

function joinTextValues(value: unknown): string | undefined {
  const text = collectTextValues(value).join('\n').trim();
  return text || undefined;
}

// Heuristic: extract the publication name from titles like
// "… – Libération" or "… | The Guardian" or "… - Cahiers du Cinéma".
// Returns {title, source} where title has the trailing source removed when found.
function splitTitleAndSource(raw: string): { title: string; source?: string } {
  const trimmed = raw.trim();
  const separators = [' – ', ' — ', ' | ', ' - '];
  for (const sep of separators) {
    const idx = trimmed.lastIndexOf(sep);
    if (idx > 0 && idx > trimmed.length - 60) {
      const tail = trimmed.slice(idx + sep.length).trim();
      if (tail.length > 0 && tail.length < 50 && !/^\d/.test(tail)) {
        return { title: trimmed.slice(0, idx).trim(), source: tail };
      }
    }
  }
  return { title: trimmed };
}

export async function fetchAirtableRecords(
  tableName: string,
  fields?: string[],
  viewName?: string | null,
): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  // Default to the legacy films view; pass null to fetch a table without view filtering.
  const view = viewName === undefined ? VIEW_NAME : viewName;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`);
    if (view) url.searchParams.set('view', view);
    if (offset) url.searchParams.set('offset', offset);
    if (fields) {
      for (const field of fields) url.searchParams.append('fields[]', field);
    }

    // cache: 'no-store' — unstable_cache owns the revalidation lifecycle at the
    // processed Film[] level. Caching the raw 4 MB fetch response here would
    // exceed Next.js's 2 MB fetch-cache limit and silently fail every time.
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Airtable request failed with status ${res.status} for table ${tableName}`);
    }

    const data = (await res.json()) as {
      records?: Array<{ id?: string; fields?: AirtableFieldMap }>;
      offset?: string;
    };

    allRecords.push(...(data.records ?? []).map((record) => ({ id: record.id, fields: record.fields ?? {} })));
    offset = data.offset;
  } while (offset);

  return allRecords;
}

// unstable_cache stores the *processed* Film[] array (~200 KB) in Next.js's
// data cache on the filesystem. This bypasses the 2 MB fetch-cache limit that
// applies to raw HTTP responses. Revalidates every 15 min, or on-demand via
// the 'films' tag (hit /api/revalidate?tag=films).
//
// We deliberately let fetch errors AND empty-result cases propagate as throws
// here — unstable_cache does not cache thrown errors, so a transient Airtable
// 429/5xx or a momentarily-empty view will retry on the next request instead
// of poisoning the cache with `[]` for up to 15 minutes.
const _readAirtableFilms = unstable_cache(
  async function (): Promise<Film[]> {
    // Films are required; their absence is fatal (cache-skipping).
    // Links / Media enrichment is best-effort: if either fetch fails (e.g. 403,
    // transient outage) the page still renders, just without those sections.
    const [filmsResult, linksResult, mediaResult] = await Promise.allSettled([
      fetchAirtableRecords(TABLE_NAME),
      fetchAirtableRecords(SYNC_LINKS_TABLE_ID, undefined, null),
      fetchAirtableRecords(SYNC_MEDIA_TABLE_ID, undefined, null),
    ]);

    if (filmsResult.status === 'rejected') throw filmsResult.reason;
    const filmRecords = filmsResult.value;

    const linkRecords = linksResult.status === 'fulfilled' ? linksResult.value : [];
    const mediaRecords = mediaResult.status === 'fulfilled' ? mediaResult.value : [];
    if (linksResult.status === 'rejected') {
      console.error('[Airtable] Links fetch failed, press articles unavailable:', linksResult.reason);
    }
    if (mediaResult.status === 'rejected') {
      console.error('[Airtable] Media fetch failed, videos and press kit unavailable:', mediaResult.reason);
    }

    const pressByMovie = _groupPressByMovie(linkRecords);
    const { videosByMovie, pressKitByMovie } = _groupMediaByMovie(mediaRecords);
    const films = _processFilmRecords(filmRecords, {
      pressByMovie,
      videosByMovie,
      pressKitByMovie,
    });
    if (films.length === 0) {
      throw new Error('[Airtable] Empty film list — skipping cache');
    }
    return films;
  },
  ['airtable-films'],
  { revalidate: 900, tags: ['films'] },
);

// React cache deduplicates within a single render pass — e.g. generateMetadata
// + the page body both call getFilms(), but unstable_cache is only hit once.
// The try/catch here is the single point where transient failures degrade
// gracefully to an empty array for the UI; the empty array is never cached.
export const readAirtableFilms = cache(async (): Promise<Film[]> => {
  try {
    return await _readAirtableFilms();
  } catch (err) {
    console.error('[Airtable] Fetch error, returning empty film list:', err);
    return [];
  }
});

type MovieJoin = {
  pressByMovie: Map<string, PressArticle[]>;
  videosByMovie: Map<string, FilmVideo[]>;
  pressKitByMovie: Map<string, string>;
};

function _processFilmRecords(records: AirtableRecord[], join?: MovieJoin): Film[] {
  const seen = new Set<string>();
  const films: Film[] = records.map((record: AirtableRecord, i: number) => {
      const f = record.fields;

      let slug = '';
      if (typeof f['slug'] === 'string' && f['slug'].trim()) slug = f['slug'].trim();
      else if (typeof f['title'] === 'string' && f['title'].trim()) slug = slugify(f['title']);
      else if (typeof f['Movie title'] === 'string' && f['Movie title'].trim()) slug = slugify(f['Movie title']);
      else slug = `film-${i}`;
      if (seen.has(slug)) slug = `${slug}-${i}`;
      seen.add(slug);

      const allImageUrls = (val: unknown): string[] => {
        if (!Array.isArray(val)) return [];
        return val
          .map((img) => {
            if (typeof img === 'object' && img !== null && typeof (img as { url?: unknown }).url === 'string') {
              return (img as { url: string }).url;
            }
            return undefined;
          })
          .filter((url): url is string => typeof url === 'string');
      };

      const stringOrValue = (val: unknown): string | undefined => {
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val !== null && typeof (val as { value?: unknown }).value === 'string') {
          return (val as { value: string }).value;
        }
        return undefined;
      };

      return {
        slug,
        title: firstString(f['title']) || firstString(f['Movie title']) || slug,
        tagline:
          firstString(f['Tagline FR']) ||
          firstString(f['Tagline EN']) ||
          firstString(f['Tagline Fr']) ||
          firstString(f['Tagline En']) ||
          firstString(f['Tagline']) ||
          undefined,
        director: firstString(f['Director (Lookup)']) || firstString(f['Director (People Table)']) || firstString(f['Director']) || undefined,
        synopsis:
          firstString(f['Synopsis FR']) ||
          firstString(f['Synopsis EN']) ||
          firstString(f['Synopsis']) ||
          firstString(f['Movie Synopsis']) ||
          undefined,
        bio: firstString(f['bio']) || firstString(f['Director Bio FR']) || firstString(f['Director Bio EN']) || undefined,
        poster: getValidImageUrl(f['Poster Lookup']) || getValidImageUrl(f['Pictures (published) - Movie']) || getValidImageUrl(f['Pictures (published) - MISC']) || getValidImageUrl(f['Pictures']) || undefined,
        profilePicture: getValidImageUrl(f['Director profile picture']) || undefined,
        year: (typeof f['Release Year'] === 'number' ? f['Release Year'].toString() : firstString(f['Release Year'])) || undefined,
        genres: firstString(f['Genre']) || undefined,
        country: firstString(f['NationsFullNameFR (from Countries (Linked Record))']) || firstString(f['Countries (Linked Record)']) || undefined,
        status: firstString(f['Status Table']) || undefined,
        publish: firstString(f['Publish']) || undefined,
        category: firstString(f['Category']) || undefined,
        awards: joinTextValues(f['Festival and Awards Name EN']) || joinTextValues(f['Festival and Awards Name FR']) || undefined,
        imdb: stringOrValue(f['IMDB page']) || undefined,
        team: firstString(f['Team (People Table)']) || undefined,
        images: allImageUrls(f['Pictures (published) - Movie']) || [],
        directorWordsEnglish:
          joinTextValues(f["Director's words - english"]) ||
          joinTextValues(f['Director words english']) ||
          joinTextValues(f['Director Words English']) ||
          undefined,
        directorStatement:
          joinTextValues(f["Director's words - french"]) ||
          joinTextValues(f["Director's words - english"]) ||
          joinTextValues(f['Director statement']) ||
          undefined,
        filmography: firstString(f['Director Filmo']) || undefined,
        directorFilmography:
          joinTextValues(f['Director Filmography En']) ||
          joinTextValues(f['Director Filmography EN']) ||
          joinTextValues(f['Director Filmography']) ||
          joinTextValues(f['Director Filmography Fr']) ||
          joinTextValues(f['Director Filmography FR']) ||
          undefined,
        duration: (typeof f['Film Duration hmm'] === 'number' ? f['Film Duration hmm'].toString() : firstString(f['Film Duration hmm'])) || undefined,
        nations: firstString(f['NationsFullNameFR (from Countries (Linked Record))']) || undefined,
        quoteEN: firstString(f['Quote EN']) || undefined,
        quoteFR: firstString(f['Quote FR']) || undefined,
        festivalLogoUrl: getValidImageUrl(f['Festival Organization Logo']) || undefined,
        crewComplete: firstString(f['CrewComplete (from Crew)']) || undefined,
        production: Array.isArray(f['Production']) ? (f['Production'] as unknown[]).map(v => typeof v === 'string' ? v.trim() : '').filter(Boolean) : undefined,
        coproduction: Array.isArray(f['Co-production']) ? (f['Co-production'] as unknown[]).map(v => typeof v === 'string' ? v.trim() : '').filter(Boolean) : undefined,
        premiereDate: firstString(f['Premier date']) || firstString(f['World Premiere']) || undefined,
        mainUrl: firstString(f['Main url']) || undefined,
        videos: _resolveVideos(f, join),
        pressArticles: _resolvePressArticles(f, join),
        pressKitUrl: _resolvePressKitUrl(f, join),
      };
    });

  return films;
}

function _normalizeKey(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function _movieKeysFromFilm(f: AirtableFieldMap): string[] {
  const keys: string[] = [];
  const movieTitle = firstString(f['Movie title']) || firstString(f['title']);
  const originalTitle = firstString(f['Original Title']);
  if (movieTitle) keys.push(_normalizeKey(movieTitle));
  if (originalTitle && _normalizeKey(originalTitle) !== keys[0]) {
    keys.push(_normalizeKey(originalTitle));
  }
  return keys;
}

function _resolveVideos(f: AirtableFieldMap, join?: MovieJoin): FilmVideo[] {
  if (!join) return [];
  for (const key of _movieKeysFromFilm(f)) {
    const hit = join.videosByMovie.get(key);
    if (hit && hit.length > 0) return hit;
  }
  return [];
}

function _resolvePressArticles(f: AirtableFieldMap, join?: MovieJoin): PressArticle[] {
  if (!join) return [];
  for (const key of _movieKeysFromFilm(f)) {
    const hit = join.pressByMovie.get(key);
    if (hit && hit.length > 0) return hit;
  }
  return [];
}

function _resolvePressKitUrl(f: AirtableFieldMap, join?: MovieJoin): string | undefined {
  if (!join) return undefined;
  for (const key of _movieKeysFromFilm(f)) {
    const hit = join.pressKitByMovie.get(key);
    if (hit) return hit;
  }
  return undefined;
}

// Sync - Links → press articles, grouped by linked Movie title.
// Sort: rating desc (primary), then PublicationDate desc (secondary).
function _groupPressByMovie(records: AirtableRecord[]): Map<string, PressArticle[]> {
  type ScoredArticle = PressArticle & { _importance: number; _date: number };
  const buckets = new Map<string, ScoredArticle[]>();

  for (const r of records) {
    const f = r.fields;
    const url = firstString(f['LinkUrl']);
    const title = firstString(f['LinkTitle']);
    if (!title) continue;
    const movieTitles = f['RelatedMovie Title'];
    if (!Array.isArray(movieTitles) || movieTitles.length === 0) continue;

    const importance = typeof f['Importance'] === 'number' ? (f['Importance'] as number) : 0;
    const dateStr = firstString(f['PublicationDate']);
    const date = dateStr ? Date.parse(dateStr) : 0;
    const split = splitTitleAndSource(title);

    const article: ScoredArticle = {
      title: split.title,
      source: split.source,
      url: url && /^https?:\/\//i.test(url) ? url : undefined,
      _importance: importance,
      _date: Number.isFinite(date) ? date : 0,
    };

    for (const movieName of movieTitles) {
      if (typeof movieName !== 'string') continue;
      const key = _normalizeKey(movieName);
      if (!key) continue;
      const arr = buckets.get(key) ?? [];
      arr.push(article);
      buckets.set(key, arr);
    }
  }

  const out = new Map<string, PressArticle[]>();
  for (const [key, arr] of buckets) {
    arr.sort((a, b) => (b._importance - a._importance) || (b._date - a._date));
    out.set(key, arr.map(({ _importance, _date, ...rest }) => {
      void _importance; void _date;
      return rest;
    }));
  }
  return out;
}

// Parses the synced TitleOfMedia formula "Movie - Category - Languages, Subtitles - Availability - TypeOfFile - Filename".
// Returns the category (Trailer/Teaser/Interview/Press kit/etc) when present.
function _extractMediaCategory(titleOfMedia: string | undefined): string | undefined {
  if (!titleOfMedia) return undefined;
  const parts = titleOfMedia.split(' - ');
  // Index 0 is movie title, 1 is the category. Empty string means no category.
  const cat = parts[1]?.trim();
  return cat ? cat : undefined;
}

const VIDEO_CATEGORY_LABELS: Record<string, { label: string; type: FilmVideo['type'] }> = {
  trailer: { label: 'Trailer', type: 'trailer' },
  teaser: { label: 'Teaser', type: 'teaser' },
  interview: { label: 'Interview', type: 'interview' },
  excerpt: { label: 'Clip', type: 'clip' },
  clip: { label: 'Clip', type: 'clip' },
  film: { label: 'Film', type: 'film' },
};

// Sync - Media → playable videos + downloadable press kit, grouped by movie name.
// We use `Movie original title` (matches Sync - Movie's Original Title) and
// `FID Movie Name` (often equal to Movie title) as join keys. Filters: Publish=true,
// Availability includes "Public", and either Type=Video with urlMedia or Type=PDF
// with attachment + category=Press kit.
function _groupMediaByMovie(records: AirtableRecord[]): {
  videosByMovie: Map<string, FilmVideo[]>;
  pressKitByMovie: Map<string, string>;
} {
  const videosByMovie = new Map<string, FilmVideo[]>();
  const pressKitByMovie = new Map<string, string>();

  const isPublic = (val: unknown): boolean =>
    Array.isArray(val) && val.some((s) =>
      s === 'Public' || (typeof s === 'object' && s !== null && (s as { name?: string }).name === 'Public'),
    );

  for (const r of records) {
    const f = r.fields;
    if (f['Publish'] !== true) continue;
    if (!isPublic(f['Availability'])) continue;

    const movieKeys: string[] = [];
    const origTitle = firstString(f['Movie original title']);
    const fidMovieName = firstString(f['FID Movie Name']);
    if (origTitle) movieKeys.push(_normalizeKey(origTitle));
    if (fidMovieName) {
      const k = _normalizeKey(fidMovieName);
      if (!movieKeys.includes(k)) movieKeys.push(k);
    }
    if (movieKeys.length === 0) continue;

    const typeOfFile = firstString(f['Type of file Name']);
    const titleOfMedia = firstString(f['TitleOfMedia']);
    const category = _extractMediaCategory(titleOfMedia);

    if (typeOfFile === 'Video') {
      const url = firstString(f['urlMedia']);
      if (!url || !/^https?:\/\//i.test(url)) continue;

      const language = firstString(f['Language Name']);
      // Lookup values often include a "Subtitles" suffix (e.g. "French Subtitles") —
      // strip it so the rendered label doesn't repeat the word "Subtitles".
      const subtitles = firstString(f['Language Subtitle Name'])?.replace(/\s*Subtitles?$/i, '').trim();
      const langLabel = subtitles ? `${language ?? ''}, ${subtitles} subtitles`.trim().replace(/^,\s*/, '') : language;
      const catKey = category?.toLowerCase().trim();
      const meta = catKey ? VIDEO_CATEGORY_LABELS[catKey] : undefined;
      const baseLabel = meta?.label ?? category ?? 'Video';
      const description = firstString(f['Description']);

      const video: FilmVideo = {
        title: baseLabel,
        url,
        type: meta?.type,
        language: langLabel || undefined,
      };
      // Description is sometimes a richer title (e.g. "Conversation avec Tilda Swinton…");
      // keep it as a label override only when it's short enough not to break the card.
      if (description && description.length < 100 && !/^[A-Z][a-z]+\s+[a-z]/.test(description)) {
        video.title = description;
      }

      for (const key of movieKeys) {
        const arr = videosByMovie.get(key) ?? [];
        arr.push(video);
        videosByMovie.set(key, arr);
      }
      continue;
    }

    if (typeOfFile === 'PDF' && category && /press\s*kit/i.test(category)) {
      const attachments = f['MediaFile'];
      let url: string | undefined;
      if (Array.isArray(attachments) && attachments.length > 0) {
        const first = attachments[0] as { url?: unknown };
        if (typeof first?.url === 'string') url = first.url;
      }
      if (!url) url = firstString(f['urlMedia']);
      if (!url) continue;

      for (const key of movieKeys) {
        // Keep the first encountered press kit per movie; editors can reorder
        // by toggling Publish if multiple language variants exist.
        if (!pressKitByMovie.has(key)) pressKitByMovie.set(key, url);
      }
    }
  }

  // Stable order: trailers first, then by language alphabetically.
  for (const arr of videosByMovie.values()) {
    arr.sort((a, b) => {
      const order = (t?: FilmVideo['type']) =>
        t === 'trailer' ? 0 : t === 'teaser' ? 1 : t === 'clip' ? 2 : t === 'interview' ? 3 : t === 'film' ? 4 : 5;
      const diff = order(a.type) - order(b.type);
      if (diff !== 0) return diff;
      return (a.language ?? '').localeCompare(b.language ?? '');
    });
  }

  return { videosByMovie, pressKitByMovie };
}