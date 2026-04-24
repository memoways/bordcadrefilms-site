import { cache } from "react";
import { firstString } from "./utils";

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
export const SOCIAL_TABLE = process.env.AIRTABLE_SOCIAL_TABLE ?? "SocialMedia";

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

export function normalizePlatform(value: unknown): SocialPlatform {
  const normalized = firstString(value)?.toLowerCase() ?? "";
  return (PLATFORMS as readonly string[]).includes(normalized)
    ? (normalized as SocialPlatform)
    : "other";
}

type AirtableRecord = { id: string; fields: Record<string, unknown> };

export function mapSocialRecord(record: AirtableRecord, index: number): SocialLink {
  const f = record.fields;
  return {
    id: record.id,
    label: firstString(f.label) ?? "",
    platform: normalizePlatform(f.platform),
    url: firstString(f.url) ?? "",
    order: typeof f.order === "number" ? f.order : index + 1,
    publish: Boolean(f.publish),
  };
}

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  if (!process.env.AIRTABLE_API_KEY || !BASE_ID) return [];

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(SOCIAL_TABLE)}`,
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
      .map(mapSocialRecord)
      .filter((s) => s.publish && s.url);
  } catch (err) {
    console.error("[Airtable] Social links fetch error:", err);
    return [];
  }
});

// Admin variant: returns all rows (including unpublished, including no-URL drafts),
// always fresh. Used by the CMS editor where the user needs to see every record.
export async function getAllSocialRowsAdmin(): Promise<SocialLink[]> {
  if (!process.env.AIRTABLE_API_KEY || !BASE_ID) return [];

  try {
    const all: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(SOCIAL_TABLE)}`,
      );
      url.searchParams.set("sort[0][field]", "order");
      url.searchParams.set("sort[0][direction]", "asc");
      if (offset) url.searchParams.set("offset", offset);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
        cache: "no-store",
      });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        records?: AirtableRecord[];
        offset?: string;
      };
      all.push(...(data.records ?? []));
      offset = data.offset;
    } while (offset);

    return all.map(mapSocialRecord);
  } catch (err) {
    console.error("[Airtable] Admin social rows fetch error:", err);
    return [];
  }
}
