import { cache } from 'react';
import { firstString, getValidImageUrl } from './utils';

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
const NEWS_TABLE = process.env.AIRTABLE_NEWS_TABLE ?? 'News';

export type NewsItem = {
  slug: string;
  title: string;
  director: string;
  excerpt: string;
  content: string[];
  status: 'Currently shooting' | 'In post-production' | 'Festival premiere';
  image: string;
  location: string;
  publishedAt: string;
  link?: string;
};

type AirtableFieldMap = Record<string, unknown>;
type AirtableRecord = { id?: string; fields: AirtableFieldMap };

async function fetchNewsRecords(): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(NEWS_TABLE)}`
    );
    url.searchParams.set('sort[0][field]', 'order');
    url.searchParams.set('sort[0][direction]', 'asc');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
      next: { revalidate: 900, tags: ['news'] },
    });

    if (!res.ok) {
      throw new Error(`Airtable news fetch failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      records?: Array<{ id?: string; fields?: AirtableFieldMap }>;
      offset?: string;
    };

    allRecords.push(
      ...(data.records ?? []).map((r) => ({ id: r.id, fields: r.fields ?? {} }))
    );
    offset = data.offset;
  } while (offset);

  return allRecords;
}

function parseContent(val: unknown): string[] {
  const raw = firstString(val) ?? '';
  if (!raw) return [];
  // Split on double newlines first (paragraphs), fall back to single newlines
  const parts = raw.includes('\n\n')
    ? raw.split('\n\n')
    : raw.split('\n');
  return parts.map((p) => p.trim()).filter(Boolean);
}

export const getNews = cache(async (): Promise<NewsItem[]> => {
  try {
    const records = await fetchNewsRecords();

    return records
      .map((record): NewsItem | null => {
        const f = record.fields;
        const slug = firstString(f['slug']);
        if (!slug) return null;

        return {
          slug,
          title: firstString(f['title']) ?? slug,
          director: firstString(f['director']) ?? '',
          excerpt: firstString(f['excerpt']) ?? '',
          content: parseContent(f['content']),
          status: (firstString(f['status']) ?? 'Currently shooting') as NewsItem['status'],
          image: getValidImageUrl(f['image']) ?? '',
          location: firstString(f['location']) ?? '',
          publishedAt: firstString(f['publishedAt']) ?? '',
          link: firstString(f['link']),
        };
      })
      .filter((item): item is NewsItem => item !== null);
  } catch (err) {
    console.error('[Airtable] News fetch error:', err);
    return [];
  }
});

export const getNewsBySlug = cache(async (slug: string): Promise<NewsItem | undefined> => {
  const news = await getNews();
  return news.find((item) => item.slug === slug);
});
