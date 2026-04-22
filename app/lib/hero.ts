import { cache } from "react";
import { firstString, getValidImageUrl } from "./utils";

const FALLBACK_HERO = {
  videoUrl: "",
  posterUrl: "",
  title: "Bord Cadre Films",
  subtitle:
    "Independent film production company based in Geneva, specialising in arthouse features and short films, with an international presence at festivals and co-productions.",
  source: "fallback" as const,
};

// Hero content lives as a row in the shared SiteConfig table ({section} = "hero")
const HERO_TABLE_NAME = "SiteConfig";
const HERO_REVALIDATE_SECONDS = 3600;

type AirtableFields = Record<string, unknown>;

export type HeroVideoData = {
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
  source: "airtable" | "fallback";
};

function normalizeHero(fields: AirtableFields): HeroVideoData {
  const videoUrl =
    firstString(fields.video_url) ||
    firstString(fields.videoUrl) ||
    firstString(fields["Video URL"]) ||
    firstString(fields.video) ||
    getValidImageUrl(fields.videoFile) ||
    getValidImageUrl(fields["Video File"]) ||
    FALLBACK_HERO.videoUrl;

  const posterUrl =
    firstString(fields.poster_url) ||
    firstString(fields.posterUrl) ||
    firstString(fields["Poster URL"]) ||
    getValidImageUrl(fields.poster) ||
    getValidImageUrl(fields["Poster"]) ||
    getValidImageUrl(fields.posterFile) ||
    FALLBACK_HERO.posterUrl;

  const title = firstString(fields.title) || firstString(fields["Hero Title"]) || FALLBACK_HERO.title;
  const subtitle = firstString(fields.subtitle) || firstString(fields["Hero Subtitle"]) || FALLBACK_HERO.subtitle;

  return { videoUrl, posterUrl, title, subtitle, source: "airtable" };
}

export const readHeroVideo = cache(async function readHeroVideo(): Promise<HeroVideoData> {
  const baseId = process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    return FALLBACK_HERO;
  }

  // Fetch all SiteConfig rows — no filterByFormula so the URL is stable
  // and Next.js fetch cache can be shared across hero/home/founder callers.
  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(HERO_TABLE_NAME)}`);
  url.searchParams.set("maxRecords", "10");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: ["site-config"] },
    });

    if (!res.ok) {
      return FALLBACK_HERO;
    }

    const data = (await res.json()) as {
      records?: Array<{ fields?: AirtableFields }>;
    };

    const fields = data.records?.find(
      (r) => typeof r.fields?.section === "string" && r.fields.section === "hero"
    )?.fields;
    if (!fields) return FALLBACK_HERO;

    return normalizeHero(fields);
  } catch (error) {
    return FALLBACK_HERO;
  }
});
