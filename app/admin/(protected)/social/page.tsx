import { SocialClient, type SocialRow } from "./SocialClient";
import { normalizePlatform } from "../../../lib/social";

const TABLE = process.env.AIRTABLE_SOCIAL_TABLE ?? "SocialMedia";

async function getSocialData(): Promise<SocialRow[]> {
  const BASE = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
  const KEY = process.env.AIRTABLE_API_KEY!;

  const url = new URL(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`,
  );
  url.searchParams.set("sort[0][field]", "order");
  url.searchParams.set("sort[0][direction]", "asc");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    records?: Array<{ id: string; fields: Record<string, unknown> }>;
  };

  return (data.records ?? []).map((r, i) => ({
    id: r.id,
    label: String(r.fields.label ?? ""),
    platform: normalizePlatform(r.fields.platform),
    url: String(r.fields.url ?? ""),
    order: typeof r.fields.order === "number" ? r.fields.order : i + 1,
    publish: Boolean(r.fields.publish),
  }));
}

export const revalidate = 0;

export default async function AdminSocialPage() {
  const items = await getSocialData();
  return <SocialClient initialItems={items} />;
}
