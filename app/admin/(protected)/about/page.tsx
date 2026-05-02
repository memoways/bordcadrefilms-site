import { AboutClient, type AboutIntroData, type FounderData, type FestivalPhoto } from "./AboutClient";

// ── Server data fetch ─────────────────────────────────────────────────────

async function getAboutData(): Promise<{
  intro: AboutIntroData | null;
  founder: FounderData | null;
  photos: FestivalPhoto[];
}> {
  const BASE = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
  const KEY = process.env.AIRTABLE_API_KEY!;

  async function fetchTable(table: string, params: Record<string, string> = {}) {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
    return data.records ?? [];
  }

  const [siteConfig, photoRecords] = await Promise.all([
    fetchTable("SiteConfig", { maxRecords: "20" }),
    fetchTable(process.env.AIRTABLE_FESTIVAL_PHOTOS_TABLE ?? "FestivalPhotos", {
      "sort[0][field]": "order",
      "sort[0][direction]": "asc",
    }),
  ]);

  function getImg(fields: Record<string, unknown>, key: string): string {
    const v = fields[key];
    if (Array.isArray(v) && v.length > 0) return (v[0] as { url?: string }).url ?? "";
    return "";
  }

  const introRow = siteConfig.find(
    (r) => typeof r.fields.section === "string" && r.fields.section === "home_about",
  );

  const founderRow = siteConfig.find(
    (r) => typeof r.fields.section === "string" && r.fields.section === "founder",
  );

  const intro: AboutIntroData | null = introRow
    ? {
        id: introRow.id,
        title: String(introRow.fields.title ?? ""),
        subtitle: String(introRow.fields.subtitle ?? ""),
        description: String(introRow.fields.description ?? ""),
      }
    : null;

  const founder: FounderData | null = founderRow
    ? {
        id: founderRow.id,
        name: String(founderRow.fields.name ?? ""),
        title: String(founderRow.fields.title ?? ""),
        bio: String(founderRow.fields.bio ?? ""),
        imageUrl: getImg(founderRow.fields, "image"),
      }
    : null;

  const photos: FestivalPhoto[] = photoRecords.map((r, i) => ({
    id: r.id,
    title: String(r.fields.title ?? ""),
    festival: String(r.fields.festival ?? ""),
    year: String(r.fields.year ?? ""),
    imageUrl: getImg(r.fields, "image"),
    order: typeof r.fields.order === "number" ? r.fields.order : i + 1,
    public: Boolean(r.fields.public),
  }));

  return { intro, founder, photos };
}

// ── Page (Server Component) ───────────────────────────────────────────────

export const revalidate = 0;

export default async function AdminAboutPage() {
  const { intro, founder, photos } = await getAboutData();
  return <AboutClient initialIntro={intro} initialFounder={founder} initialPhotos={photos} />;
}
