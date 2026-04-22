import { cache } from "react";
import { firstString, getValidImageUrl } from "./utils";
const FALLBACK_HOME_ABOUT = {
  title: "Bord Cadre Films",
  subtitle: "Since 2008",
  description:
    "Bord Cadre Films is an independent Swiss production company specializing in the development, financing, and production of international feature films. Its editorial line is distinguished by its strong cultural diversity and social awareness.",
  cta_text: "Learn more",
  cta_link: "/about",
  source: "fallback" as const,
};

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
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
  return FALLBACK_HOME_ABOUT;
}

function fallbackNumbers(): BCFNumbersResponse {
  return { numbers: [], source: "fallback" };
}

export const readHomeAbout = cache(async function readHomeAbout(): Promise<HomeAboutData> {
  if (!BASE_ID || !API_KEY) return fallbackAbout();

  try {
    // Fetch all SiteConfig rows — no filterByFormula so the URL is stable
    // and Next.js fetch cache can be shared across hero/home/founder callers.
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent("SiteConfig")}`
    );
    url.searchParams.set("maxRecords", "10");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 3600, tags: ["site-config"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    const fields = data.records?.find(
      (r) => typeof r.fields?.section === "string" && r.fields.section === "home_about"
    )?.fields;
    if (!fields) return fallbackAbout();

    return {
      title: firstString(fields.title) || "Bord Cadre Films",
      subtitle: firstString(fields.subtitle) || "Since 2008",
      description:
        firstString(fields.description) ||
        "Independent film production company based in Geneva, specialising in arthouse features and short films, with an international presence at festivals and co-productions.",
      cta_text: firstString(fields.cta_text) || "Learn more",
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
    return { items: [], total: 0, source: "fallback" };
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_NEWS_TABLE || "News"
      )}`
    );
    url.searchParams.set("maxRecords", limit.toString());
    url.searchParams.set("sort[0][field]", "publishedAt");
    url.searchParams.set("sort[0][direction]", "desc");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 1800, tags: ["home-news"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ id: string; fields?: Record<string, unknown> }>;
    };

    const items: NewsItemData[] = data.records
      ?.map((record) => ({
        id: record.id,
        slug: firstString(record.fields?.slug) || record.id,
        title: firstString(record.fields?.title) || "Untitled",
        excerpt: firstString(record.fields?.excerpt) || "",
        image: getValidImageUrl(record.fields?.image) || "/news/placeholder.png",
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
