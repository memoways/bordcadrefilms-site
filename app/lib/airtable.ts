import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { slugify, firstString, getValidImageUrl } from './utils';

const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME!;
const VIEW_NAME = process.env.AIRTABLE_VIEW_NAME!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

// IDs des deux autres tables de la même base (synchronisées, pas de vue custom).
const SYNC_LINKS_TABLE_ID = 'tblUeAy7N0myD5HkR';
const SYNC_MEDIA_TABLE_ID = 'tblRM4z90LYZcy5Tv';
const CREW_TABLE_ID = 'tblOhvIC5ucfDKQM6';
const PEOPLE_TABLE_ID = 'tblXf4qKCsbCbLRNl';
const FESTIVALS_TABLE_NAME = 'Festivals';
const FESTIVALS_VIEW_NAME = 'Vue de travail - Chloé';

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

export type FilmCrewDetails = {
  screenplay?: string;
  cinematography?: string;
  sound?: string;
  edit?: string;
  music?: string;
  cast?: string;
  productionCompany?: string;
};

export type Film = {
  slug: string;
  title: string;
  originalTitle?: string;
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
  crewDetails?: FilmCrewDetails;
  awards?: string;
  videos?: FilmVideo[];
  pressArticles?: PressArticle[];
  pressKitUrl?: string;
};

type AirtableFieldMap = Record<string, unknown>;
export type AirtableRecord = { id?: string; fields: AirtableFieldMap };

type FetchAirtableOptions = {
  baseId?: string;
  filterByFormula?: string;
  maxRecords?: number;
};

const FILM_FIELDS = [
  'Movie title',
  'Original Title',
  'Release Year',
  'Synopsis EN',
  'Tagline EN',
  'Tagline FR',
  'Director (Lookup)',
  'Director (People Table)',
  'Director Bio EN',
  'Director Bio FR',
  'Poster Lookup',
  'Pictures (published) - Movie',
  'Pictures (published) - MISC',
  'Pictures',
  'Director profile picture',
  'Genre',
  'NationsFullNameEn (from Countries (Linked Record))',
  'NationsFullNameFR (from Countries (Linked Record))',
  'Countries (Linked Record)',
  'Status Table',
  'Publish',
  'Category',
  'IMDB page',
  'Team (People Table)',
  "Director's words - english",
  "Director's words - french",
  'Director Statement EN',
  'Director Statement FR',
  'Director Filmo',
  'Director Filmography EN',
  'Film Duration hmm',
  'Quote EN',
  'Quote FR',
  'Festival Organization Logo',
  'CrewComplete (from Crew)',
];

const CREW_FIELDS = [
  'TitleOfMovie',
  'CrewComplete',
  'Main cast',
  'Screenplay People Table',
  'Cinematography People Table',
  'Sound People Table',
  'Editor People Table',
  'Music People Table',
];

const PEOPLE_FIELDS = [
  'FullName',
];

const FESTIVAL_FIELDS = [
  'Movie',
  'AwardStatement EN',
  'Name Selection EN',
  'Type',
  'Logo of festival or award',
];

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
  options?: FetchAirtableOptions,
): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  // Default to the legacy films view; pass null to fetch a table without view filtering.
  const view = viewName === undefined ? VIEW_NAME : viewName;
  const baseId = options?.baseId ?? BASE_ID;

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
    if (view) url.searchParams.set('view', view);
    if (offset) url.searchParams.set('offset', offset);
    if (options?.filterByFormula) url.searchParams.set('filterByFormula', options.filterByFormula);
    if (options?.maxRecords) url.searchParams.set('maxRecords', String(options.maxRecords));
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
    // Airtable rate-limits at 5 req/sec/base. With pagination on large tables a
    // 6-way parallel burst easily breaches that on a cold cache, returning 429
    // — silently swallowed by Promise.allSettled, surfacing as missing media or
    // crew data on the rendered page. Split into two waves of 3 to keep peak
    // concurrency comfortably under the cap.
    const [filmsResult, linksResult, mediaResult] = await Promise.allSettled([
      fetchAirtableRecords(TABLE_NAME, FILM_FIELDS),
      fetchAirtableRecords(SYNC_LINKS_TABLE_ID, undefined, null),
      fetchAirtableRecords(SYNC_MEDIA_TABLE_ID, undefined, null),
    ]);
    const [crewResult, peopleResult, festivalResult] = await Promise.allSettled([
      fetchAirtableRecords(CREW_TABLE_ID, CREW_FIELDS, null),
      fetchAirtableRecords(PEOPLE_TABLE_ID, PEOPLE_FIELDS, null),
      fetchAirtableRecords(FESTIVALS_TABLE_NAME, FESTIVAL_FIELDS, FESTIVALS_VIEW_NAME),
    ]);

    if (filmsResult.status === 'rejected') throw filmsResult.reason;
    const filmRecords = filmsResult.value;

    const linkRecords = linksResult.status === 'fulfilled' ? linksResult.value : [];
    const mediaRecords = mediaResult.status === 'fulfilled' ? mediaResult.value : [];
    const festivalRecords = festivalResult.status === 'fulfilled' ? festivalResult.value : [];
    if (linksResult.status === 'rejected') {
      console.error('[Airtable] Links fetch failed, press articles unavailable:', linksResult.reason);
    }
    if (mediaResult.status === 'rejected') {
      console.error('[Airtable] Media fetch failed, videos and press kit unavailable:', mediaResult.reason);
    }
    if (crewResult.status === 'rejected') {
      console.error('[Airtable] Crew fetch failed, screenplay unavailable:', crewResult.reason);
    }
    if (peopleResult.status === 'rejected') {
      console.error('[Airtable] People fetch failed, screenplay unavailable:', peopleResult.reason);
    }
    if (festivalResult.status === 'rejected') {
      console.error('[Airtable] Festivals fetch failed, awards unavailable:', festivalResult.reason);
    }

    const pressByMovie = _groupPressByMovie(linkRecords);
    const { videosByMovie, pressKitByMovie } = await _groupMediaByMovie(mediaRecords);
    const crewByMovieId = _groupCrewByMovie(
      crewResult.status === 'fulfilled' ? crewResult.value : [],
      peopleResult.status === 'fulfilled' ? peopleResult.value : [],
    );
    const awardsByMovieId = _groupAwardsByMovie(festivalRecords);
    const films = _processFilmRecords(filmRecords, {
      pressByMovie,
      videosByMovie,
      pressKitByMovie,
      crewByMovieId,
      awardsByMovieId,
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
  crewByMovieId: Map<string, FilmCrewDetails>;
  awardsByMovieId: Map<string, { statement: string; logoUrl?: string }>;
};

function parseCrewComplete(raw?: string): Record<string, string> {
  if (!raw) return {};

  const result: Record<string, string> = {};
  for (const segment of raw.split('|')) {
    const colon = segment.indexOf(':');
    if (colon < 0) continue;
    const key = segment.slice(0, colon).trim();
    const value = segment.slice(colon + 1).trim().replace(/,\s*$/, '').trim();
    if (key && value) result[key] = value;
  }
  return result;
}

function linkedPeopleNames(value: unknown, peopleById: Map<string, string>): string | undefined {
  if (!Array.isArray(value)) return undefined;

  const names = value
    .map((id) => (typeof id === 'string' ? peopleById.get(id) : undefined))
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(', ') : undefined;
}

function stripLabel(value: string | undefined, label: string): string | undefined {
  if (!value) return undefined;
  const text = value.trim();
  const prefix = `${label}:`;
  return text.startsWith(prefix) ? text.slice(prefix.length).trim() || undefined : text;
}

function _groupAwardsByMovie(records: AirtableRecord[]): Map<string, { statement: string; logoUrl?: string }> {
  const buckets = new Map<string, { statements: string[]; logoUrl?: string }>();

  for (const record of records) {
    const movieLinks = record.fields['Movie'];
    if (!Array.isArray(movieLinks) || movieLinks.length === 0) continue;

    const statement = joinTextValues(record.fields['AwardStatement EN']) || firstString(record.fields['Name Selection EN']);
    if (!statement) continue;
    const logoUrl = getValidImageUrl(record.fields['Logo of festival or award']);

    for (const movieId of movieLinks) {
      if (typeof movieId !== 'string') continue;
      const bucket = buckets.get(movieId) || { statements: [], logoUrl: undefined };
      
      // Avoid duplicate statements (sometimes same award appears twice in different views)
      if (!bucket.statements.includes(statement)) {
        bucket.statements.push(statement);
      }
      
      // Keep the first logo found for this movie
      if (!bucket.logoUrl && logoUrl) {
        bucket.logoUrl = logoUrl;
      }
      
      buckets.set(movieId, bucket);
    }
  }

  const result = new Map<string, { statement: string; logoUrl?: string }>();
  for (const [movieId, bucket] of buckets) {
    result.set(movieId, {
      statement: bucket.statements.join('\n'),
      logoUrl: bucket.logoUrl,
    });
  }

  return result;
}

function _groupCrewByMovie(crewRecords: AirtableRecord[], peopleRecords: AirtableRecord[]): Map<string, FilmCrewDetails> {
  const peopleById = new Map<string, string>();
  for (const record of peopleRecords) {
    if (!record.id) continue;
    const name = firstString(record.fields['FullName']);
    if (name) peopleById.set(record.id, name);
  }

  const out = new Map<string, FilmCrewDetails>();
  for (const record of crewRecords) {
    const movieIds = record.fields['TitleOfMovie'];
    if (!Array.isArray(movieIds)) continue;

    const crew = parseCrewComplete(firstString(record.fields['CrewComplete']));
    const details: FilmCrewDetails = {
      screenplay: linkedPeopleNames(record.fields['Screenplay People Table'], peopleById),
      cinematography:
        linkedPeopleNames(record.fields['Cinematography People Table'], peopleById) ||
        crew['Cinematography'],
      sound:
        linkedPeopleNames(record.fields['Sound People Table'], peopleById) ||
        crew['Sound Design'] ||
        crew['Sound'],
      edit:
        linkedPeopleNames(record.fields['Editor People Table'], peopleById) ||
        crew['Editor'],
      music:
        linkedPeopleNames(record.fields['Music People Table'], peopleById) ||
        crew['Music'],
      cast: stripLabel(firstString(record.fields['Main cast']), 'Main cast') || crew['Stars'],
      productionCompany: crew['Production'],
    };

    for (const movieId of movieIds) {
      if (typeof movieId === 'string') out.set(movieId, details);
    }
  }

  return out;
}

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

      const movieCrew = parseCrewComplete(firstString(f['CrewComplete (from Crew)']));
      const joinedCrew = record.id ? join?.crewByMovieId.get(record.id) : undefined;
      const joinedAwards = record.id ? join?.awardsByMovieId.get(record.id) : undefined;

      return {
        slug,
        title: firstString(f['Movie title']) || slug,
        originalTitle: firstString(f['Original Title']) || undefined,
        tagline:
          firstString(f['Tagline EN']) ||
          firstString(f['Tagline FR']) ||
          firstString(f['Tagline']) ||
          undefined,
        director: firstString(f['Director (Lookup)']) || firstString(f['Director (People Table)']) || firstString(f['Director']) || undefined,
        synopsis:
          firstString(f['Synopsis EN']) ||
          firstString(f['Synopsis']) ||
          firstString(f['Movie Synopsis']) ||
          undefined,
        bio: firstString(f['Director Bio EN']) || firstString(f['bio']) || firstString(f['Director Bio FR']) || undefined,
        poster: getValidImageUrl(f['Poster Lookup']) || getValidImageUrl(f['Pictures (published) - Movie']) || getValidImageUrl(f['Pictures (published) - MISC']) || getValidImageUrl(f['Pictures']) || undefined,
        profilePicture: getValidImageUrl(f['Director profile picture']) || undefined,
        year: (typeof f['Release Year'] === 'number' ? f['Release Year'].toString() : firstString(f['Release Year'])) || undefined,
        genres: firstString(f['Genre']) || undefined,
        country: firstString(f['NationsFullNameEn (from Countries (Linked Record))']) || firstString(f['NationsFullNameFR (from Countries (Linked Record))']) || firstString(f['Countries (Linked Record)']) || undefined,
        status: firstString(f['Status Table']) || undefined,
        publish: firstString(f['Publish']) || undefined,
        category: firstString(f['Category']) || undefined,
        imdb: stringOrValue(f['IMDB page']) || undefined,
        team: firstString(f['Team (People Table)']) || undefined,
        images: allImageUrls(f['Pictures (published) - Movie']) || [],
        directorWordsEnglish:
          joinTextValues(f["Director's words - english"]) ||
          joinTextValues(f['Director words english']) ||
          joinTextValues(f['Director Words English']) ||
          undefined,
        directorStatement:
          joinTextValues(f["Director's words - english"]) ||
          joinTextValues(f["Director's words - french"]) ||
          joinTextValues(f['Director Statement EN']) ||
          joinTextValues(f['Director Statement FR']) ||
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
        nations: firstString(f['NationsFullNameEn (from Countries (Linked Record))']) || firstString(f['NationsFullNameFR (from Countries (Linked Record))']) || undefined,
        quoteEN: firstString(f['Quote EN']) || undefined,
        quoteFR: firstString(f['Quote FR']) || undefined,
        festivalLogoUrl: joinedAwards?.logoUrl || getValidImageUrl(f['Festival Organization Logo']) || undefined,
        crewDetails: {
          screenplay: joinedCrew?.screenplay,
          cinematography: joinedCrew?.cinematography || movieCrew['Cinematography'],
          sound: joinedCrew?.sound || movieCrew['Sound Design'] || movieCrew['Sound'],
          edit: joinedCrew?.edit || movieCrew['Editor'],
          music: joinedCrew?.music || movieCrew['Music'],
          cast: joinedCrew?.cast || movieCrew['Stars'],
          productionCompany: joinedCrew?.productionCompany || movieCrew['Production'],
        },
        awards: joinedAwards?.statement || undefined,
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
async function _groupMediaByMovie(records: AirtableRecord[]): Promise<{
  videosByMovie: Map<string, FilmVideo[]>;
  pressKitByMovie: Map<string, string>;
}> {
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

  // Resolve Vimeo thumbnails via the public oEmbed endpoint. YouTube can
  // synthesize a thumbnail URL from the video ID alone (img.youtube.com/vi/X);
  // Vimeo cannot — its thumbnail lives at i.vimeocdn.com under an opaque ID
  // that only the API exposes. Done in parallel and per-unique-id so 32
  // Vimeo videos cost roughly the latency of one oEmbed call.
  const vimeoVideos = new Map<string, FilmVideo[]>();
  for (const arr of videosByMovie.values()) {
    for (const v of arr) {
      const m = v.url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (!m) continue;
      const list = vimeoVideos.get(m[1]) ?? [];
      list.push(v);
      vimeoVideos.set(m[1], list);
    }
  }
  if (vimeoVideos.size > 0) {
    const entries = await Promise.all(
      Array.from(vimeoVideos.keys()).map(async (id): Promise<[string, string | undefined]> => {
        try {
          const res = await fetch(
            `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`,
            { next: { revalidate: 86400 } },
          );
          if (!res.ok) return [id, undefined];
          const data = (await res.json()) as { thumbnail_url?: unknown };
          return [id, typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined];
        } catch {
          return [id, undefined];
        }
      }),
    );
    for (const [id, thumb] of entries) {
      if (!thumb) continue;
      for (const v of vimeoVideos.get(id) ?? []) v.thumbnail = thumb;
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
