import { cache } from "react";
import { firstString, getValidImageUrl } from "./utils";

// Hero content lives as a row in the shared SiteConfig table ({section} = "hero")
const HERO_TABLE_NAME = "SiteConfig";
const HERO_REVALIDATE_SECONDS = 3600;

type AirtableFields = Record<string, unknown>;

export type HeroVideoData = {
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
  description: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  source: "airtable" | "fallback";
};

const FALLBACK_HERO: HeroVideoData = {
  videoUrl: "",
  posterUrl: "",
  title: "Bord Cadre Films",
  subtitle: "",
  description:
    "Independent film production company based in Geneva, specialising in arthouse features and short films, with an international presence at festivals and co-productions.",
  cta1Text: "View films",
  cta1Link: "/films",
  cta2Text: "Directors",
  cta2Link: "/directors",
  source: "fallback",
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
  const description = firstString(fields.description) || firstString(fields["Hero Description"]) || FALLBACK_HERO.description;

  const cta1Text = firstString(fields.cta1_text) || firstString(fields["CTA1 Text"]) || FALLBACK_HERO.cta1Text;
  const cta1Link = firstString(fields.cta1_link) || firstString(fields["CTA1 Link"]) || FALLBACK_HERO.cta1Link;
  const cta2Text = firstString(fields.cta2_text) || firstString(fields["CTA2 Text"]) || FALLBACK_HERO.cta2Text;
  const cta2Link = firstString(fields.cta2_link) || firstString(fields["CTA2 Link"]) || FALLBACK_HERO.cta2Link;

  return {
    videoUrl,
    posterUrl,
    title,
    subtitle,
    description,
    cta1Text,
    cta1Link,
    cta2Text,
    cta2Link,
    source: "airtable",
  };
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
