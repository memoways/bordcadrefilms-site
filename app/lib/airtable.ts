import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { slugify, firstString, getValidImageUrl } from './utils';

const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME!;
const VIEW_NAME = process.env.AIRTABLE_VIEW_NAME!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

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

export async function fetchAirtableRecords(
  tableName: string,
  fields?: string[],
): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('view', VIEW_NAME);
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
    const records = await fetchAirtableRecords(TABLE_NAME);
    const films = _processFilmRecords(records);
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

function _processFilmRecords(records: AirtableRecord[]): Film[] {
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
      };
    });

  return films;
}