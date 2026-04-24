import { NextResponse } from "next/server";
import { normalizePlatform } from "../../lib/social";

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
const API_KEY = process.env.AIRTABLE_API_KEY!;
const TABLE = process.env.AIRTABLE_SOCIAL_TABLE ?? "SocialMedia";

export async function GET() {
  if (!API_KEY || !BASE_ID) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
    url.searchParams.set("sort[0][field]", "order");
    url.searchParams.set("sort[0][direction]", "asc");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[API] /api/social Airtable fetch failed", res.status, await res.text());
      return NextResponse.json([], { status: 200 });
    }

    const data = (await res.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
    const links = (data.records ?? [])
      .map((record) => ({
        id: record.id,
        label: String(record.fields.label ?? ""),
        platform: normalizePlatform(record.fields.platform),
        url: String(record.fields.url ?? ""),
        publish: Boolean(record.fields.publish),
      }))
      .filter((link) => link.publish && link.url);

    return NextResponse.json(links);
  } catch (error) {
    console.error("[API] /api/social error", error);
    return NextResponse.json([], { status: 200 });
  }
}
