import { cache } from "react";
import { MOCK_HOME_ABOUT, MOCK_BCF_NUMBERS, MOCK_NEWS } from "./mock-data";

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export type HomeAboutData = {
  title: string;
  subtitle: string;
  description: string;
  cta_text?: string;
  cta_link?: string;
  background_image?: string;
  source: "airtable" | "fallback";
};

export type NewsItemData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  status: string;
  publishedAt: string;
  order: number;
};

export type BCFNumbersData = {
  number: number;
  label: string;
  description?: string;
  order: number;
};

export type HomeNewsResponse = {
  items: NewsItemData[];
  total: number;
  source: "airtable" | "fallback";
};

export type BCFNumbersResponse = {
  numbers: BCFNumbersData[];
  source: "airtable" | "fallback";
};

function fallbackAbout(): HomeAboutData {
  return MOCK_HOME_ABOUT;
}

function fallbackNumbers(): BCFNumbersResponse {
  return { numbers: MOCK_BCF_NUMBERS, source: "fallback" };
}

export const readHomeAbout = cache(async function readHomeAbout(): Promise<HomeAboutData> {
  if (!BASE_ID || !API_KEY) return fallbackAbout();

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_HOME_ABOUT_TABLE || "HomeAbout"
      )}`
    );
    url.searchParams.set("maxRecords", "1");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 3600, tags: ["home-about"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    const fields = data.records?.[0]?.fields;
    if (!fields) return fallbackAbout();

    const firstString = (v: unknown): string | undefined => {
      if (typeof v === "string") return v.trim();
      if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
      return undefined;
    };

    return {
      title: firstString(fields.title) || "Bord Cadre Films",
      subtitle: firstString(fields.subtitle) || "Depuis 2008",
      description:
        firstString(fields.description) ||
        "Société de production cinématographique basée à Genève, spécialisée dans la production de films d'auteur, longs et courts métrages, avec une présence internationale dans les festivals et coproductions.",
      cta_text: firstString(fields.cta_text) || "En savoir plus",
      cta_link: firstString(fields.cta_link) || "/about",
      background_image: firstString(fields.background_image),
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Home About fetch error:", error);
    return fallbackAbout();
  }
});

export const readBCFNumbers = cache(async function readBCFNumbers(): Promise<BCFNumbersResponse> {
  if (!BASE_ID || !API_KEY) return fallbackNumbers();

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_NUMBERS_TABLE || "BCFNumbers"
      )}`
    );

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 3600, tags: ["bcf-numbers"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    if (!data.records || data.records.length === 0) return fallbackNumbers();

    const numbers = data.records
      .map((record, idx) => ({
        number: typeof record.fields?.number === "number" ? record.fields.number : 0,
        label: typeof record.fields?.label === "string" ? record.fields.label : "",
        description: typeof record.fields?.description === "string" ? record.fields.description : undefined,
        order: typeof record.fields?.order === "number" ? record.fields.order : idx + 1,
      }))
      .sort((a, b) => a.order - b.order);

    return {
      numbers,
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] BCF Numbers fetch error:", error);
    return fallbackNumbers();
  }
});

export const readHomeNews = cache(async function readHomeNews(
  limit = 3
): Promise<HomeNewsResponse> {
  if (!BASE_ID || !API_KEY) {
    const items = MOCK_NEWS.slice(0, limit);
    return { items, total: items.length, source: "fallback" };
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_NEWS_TABLE || "News"
      )}`
    );
    url.searchParams.set("maxRecords", limit.toString());
    url.searchParams.set("sort[]field", "publishedAt");
    url.searchParams.set("sort[]direction", "desc");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 1800, tags: ["home-news"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ id: string; fields?: Record<string, unknown> }>;
    };

    const firstString = (v: unknown): string | undefined => {
      if (typeof v === "string") return v.trim();
      if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
      return undefined;
    };

    const firstImage = (v: unknown): string | undefined => {
      if (!Array.isArray(v) || v.length === 0) return undefined;
      const first = v[0] as { url?: unknown };
      if (typeof first.url === "string") return first.url;
      return undefined;
    };

    const items: NewsItemData[] = data.records
      ?.map((record) => ({
        id: record.id,
        slug: firstString(record.fields?.slug) || record.id,
        title: firstString(record.fields?.title) || "Untitled",
        excerpt: firstString(record.fields?.excerpt) || "",
        image: firstImage(record.fields?.image) || "/news/placeholder.png",
        status: firstString(record.fields?.status) || "News",
        publishedAt: firstString(record.fields?.publishedAt) || new Date().toISOString(),
        order: typeof record.fields?.order === "number" ? record.fields.order : 0,
      }))
      .sort((a, b) => b.order - a.order) || [];

    return {
      items,
      total: items.length,
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Home News fetch error:", error);
    return {
      items: [],
      total: 0,
      source: "fallback",
    };
  }
});
