import { HomeClient, type SiteConfigRow, type BCFNumber } from "./HomeClient";

// ── Server data fetch ─────────────────────────────────────────────────────

async function getHomeData(): Promise<{
  homeAbout: SiteConfigRow | null;
  numbers: BCFNumber[];
}> {
  const BASE = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
  const KEY = process.env.AIRTABLE_API_KEY!;

  async function fetchTable(table: string) {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { records?: Array<{ id: string; fields: Record<string, unknown> }> };
    return data.records ?? [];
  }

  const [configRecords, numberRecords] = await Promise.all([
    fetchTable("SiteConfig"),
    fetchTable("BCFNumbers"),
  ]);

  const homeRow = configRecords.find(
    (r) => typeof r.fields.section === "string" && r.fields.section === "home_about",
  );

  const homeAbout: SiteConfigRow | null = homeRow
    ? {
        id: homeRow.id,
        section: "home_about",
        title: String(homeRow.fields.title ?? ""),
        subtitle: String(homeRow.fields.subtitle ?? ""),
        description: String(homeRow.fields.description ?? ""),
        cta_text: String(homeRow.fields.cta_text ?? ""),
        cta_link: String(homeRow.fields.cta_link ?? ""),
      }
    : null;

  const numbers: BCFNumber[] = numberRecords.map((r, i) => ({
    id: r.id,
    number: String(r.fields.number ?? ""),
    label: String(r.fields.label ?? ""),
    description: String(r.fields.description ?? ""),
    order: String(r.fields.order ?? i + 1),
  }));

  return { homeAbout, numbers };
}

// ── Page (Server Component) ───────────────────────────────────────────────

export const revalidate = 0;

export default async function AdminHomePage() {
  const data = await getHomeData();
  return <HomeClient {...data} />;
}
