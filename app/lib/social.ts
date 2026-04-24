import { cache } from "react";
import { firstString } from "./utils";

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
const TABLE = process.env.AIRTABLE_SOCIAL_TABLE ?? "SocialMedia";

export type SocialPlatform =
  | "youtube"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "twitter"
  | "vimeo"
  | "tiktok"
  | "other";

export type SocialLink = {
  id: string;
  label: string;
  platform: SocialPlatform;
  url: string;
  order: number;
  publish: boolean;
};

const PLATFORMS: readonly SocialPlatform[] = [
  "youtube",
  "linkedin",
  "facebook",
  "instagram",
  "twitter",
  "vimeo",
  "tiktok",
  "other",
];

function normalisePlatform(val: unknown): SocialPlatform {
  const s = firstString(val)?.toLowerCase();
  return (PLATFORMS as readonly string[]).includes(s ?? "")
    ? (s as SocialPlatform)
    : "other";
}

type AirtableRecord = { id: string; fields: Record<string, unknown> };

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  if (!process.env.AIRTABLE_API_KEY || !BASE_ID) return [];

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
    );
    url.searchParams.set("sort[0][field]", "order");
    url.searchParams.set("sort[0][direction]", "asc");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
      next: { revalidate: 900, tags: ["social-media"] },
    });

    if (!res.ok) return [];
    const data = (await res.json()) as { records?: AirtableRecord[] };

    return (data.records ?? [])
      .map((r, i): SocialLink => ({
        id: r.id,
        label: firstString(r.fields.label) ?? "",
        platform: normalisePlatform(r.fields.platform),
        url: firstString(r.fields.url) ?? "",
        order: typeof r.fields.order === "number" ? r.fields.order : i + 1,
        publish: Boolean(r.fields.publish),
      }))
      .filter((s) => s.publish && s.url);
  } catch (err) {
    console.error("[Airtable] Social links fetch error:", err);
    return [];
  }
});
