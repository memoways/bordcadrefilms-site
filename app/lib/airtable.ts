import { cache } from 'react';
import { slugify } from './utils';

const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME!;
const VIEW_NAME = process.env.AIRTABLE_VIEW_NAME!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const FESTIVALS_TABLE_NAME = process.env.AIRTABLE_FESTIVALS_TABLE_NAME || 'festivals';

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
};

type AirtableFieldMap = Record<string, unknown>;
type AirtableRecord = { id?: string; fields: AirtableFieldMap };

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

function isAirtableRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]+$/.test(value);
}

function getDisplayText(fields: AirtableFieldMap): string | undefined {
  const preferredKeys = ['title', 'Title', 'name', 'Name', 'festival', 'Festival', 'label', 'Label', 'festival_name', 'Festival Name', 'festivalName'];

  for (const key of preferredKeys) {
    const text = joinTextValues(fields[key]);
    if (text && !isAirtableRecordId(text)) return text;
  }

  for (const value of Object.values(fields)) {
    const text = joinTextValues(value);
    if (text && !isAirtableRecordId(text)) return text;
  }

  return undefined;
}

function resolveLinkedText(value: unknown, byId: Map<string, string>): string | undefined {
  const tokens = collectTextValues(value);
  if (tokens.length === 0) return undefined;

  const resolved = tokens
    .map((token) => {
      const trimmed = token.trim();
      if (!trimmed) return undefined;
      const lookup = byId.get(trimmed);
      if (lookup) return lookup;
      if (isAirtableRecordId(trimmed)) return undefined;
      return trimmed;
    })
    .filter((item): item is string => Boolean(item));

  return resolved.length > 0 ? resolved.join('\n') : undefined;
}

async function fetchAirtableRecords(tableName: string, revalidateTag: string): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('view', VIEW_NAME);
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
      next: { revalidate: 900, tags: [revalidateTag] },
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

export const readAirtableFilms = cache(async function (): Promise<Film[]> {
  try {
    const records = await fetchAirtableRecords(TABLE_NAME, 'films');

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

      const firstString = (val: unknown): string | undefined => {
        if (typeof val === 'string') return val;
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
        return undefined;
      };

      const firstImageUrl = (val: unknown): string | undefined => {
        if (!Array.isArray(val) || val.length === 0 || typeof val[0] !== 'object' || val[0] === null) return undefined;
        const first = val[0] as { url?: unknown };
        return typeof first.url === 'string' ? first.url : undefined;
      };

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
        poster: firstImageUrl(f['Poster Lookup']) || firstImageUrl(f['Pictures (published) - Movie']) || firstImageUrl(f['Pictures (published) - MISC']) || firstImageUrl(f['Pictures']) || undefined,
        profilePicture: firstImageUrl(f['Director profile picture']) || undefined,
        year: (typeof f['Release Year'] === 'number' ? f['Release Year'].toString() : firstString(f['Release Year'])) || undefined,
        genres: firstString(f['Genre']) || undefined,
        country: firstString(f['NationsFullNameFR (from Countries (Linked Record))']) || firstString(f['Countries (Linked Record)']) || undefined,
        status: firstString(f['Status Table']) || undefined,
        publish: firstString(f['Publish']) || undefined,
        category: firstString(f['Category']) || undefined,
        awards: joinTextValues(f['Festival and Awards']) || undefined,
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
      };
    });

    return films;
  } catch (err) {
    console.error('[Airtable] Fetch error, returning empty film list:', err);
    return [];
  }
});