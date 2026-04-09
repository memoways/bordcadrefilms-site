import { cache } from "react";
import { MOCK_HERO } from "./mock-data";

const HERO_TABLE_NAME = process.env.AIRTABLE_HERO_TABLE_NAME || "HeroVideo";
const HERO_VIEW_NAME = process.env.AIRTABLE_HERO_VIEW_NAME;
const HERO_REVALIDATE_SECONDS = 3600;

type AirtableAttachment = { url?: unknown };
type AirtableFields = Record<string, unknown>;

export type HeroVideoData = {
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
  source: "airtable" | "fallback";
};

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return undefined;
}

function firstAttachmentUrl(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const first = value[0] as AirtableAttachment;
  if (typeof first?.url === "string" && first.url.trim()) return first.url.trim();

  return undefined;
}

function normalizeHero(fields: AirtableFields): HeroVideoData {
  const videoUrl =
    firstString(fields.videoUrl) ||
    firstString(fields["Video URL"]) ||
    firstString(fields.video) ||
    firstAttachmentUrl(fields.videoFile) ||
    firstAttachmentUrl(fields["Video File"]) ||
    firstAttachmentUrl(fields.videoAttachment) ||
    firstAttachmentUrl(fields["Video Attachment"]) ||
    MOCK_HERO.videoUrl;

  const posterUrl =
    firstString(fields.posterUrl) ||
    firstString(fields["Poster URL"]) ||
    firstAttachmentUrl(fields.poster) ||
    firstAttachmentUrl(fields["Poster"]) ||
    firstAttachmentUrl(fields.posterFile) ||
    firstAttachmentUrl(fields["Poster File"]) ||
    MOCK_HERO.posterUrl;

  const title = firstString(fields.title) || firstString(fields["Hero Title"]) || MOCK_HERO.title;
  const subtitle = firstString(fields.subtitle) || firstString(fields["Hero Subtitle"]) || MOCK_HERO.subtitle;

  return { videoUrl, posterUrl, title, subtitle, source: "airtable" };
}

export const readHeroVideo = cache(async function readHeroVideo(): Promise<HeroVideoData> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    return MOCK_HERO;
  }

  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(HERO_TABLE_NAME)}`);
  url.searchParams.set("maxRecords", "1");
  if (HERO_VIEW_NAME) {
    url.searchParams.set("view", HERO_VIEW_NAME);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: HERO_REVALIDATE_SECONDS, tags: ["hero-video"] },
    });

    if (!res.ok) {
      return MOCK_HERO;
    }

    const data = (await res.json()) as {
      records?: Array<{ fields?: AirtableFields }>;
    };

    const fields = data.records?.[0]?.fields;
    if (!fields) return MOCK_HERO;

    return normalizeHero(fields);
  } catch (error) {
    return MOCK_HERO;
  }
});
