import { HomeClient, type SiteConfigRow, type HeroRow, type BCFNumber } from "./HomeClient";

async function getHomeData(): Promise<{
  hero: HeroRow | null;
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

  const heroRow = configRecords.find(
    (r) => typeof r.fields.section === "string" && r.fields.section === "hero",
  );
  const hero: HeroRow | null = heroRow
    ? {
        id: heroRow.id,
        title: String(heroRow.fields.title ?? ""),
        subtitle: String(heroRow.fields.subtitle ?? ""),
        description: String(heroRow.fields.description ?? ""),
        videoUrl: String(heroRow.fields.video_url ?? ""),
        posterUrl: String(heroRow.fields.poster_url ?? ""),
        cta1Text: String(heroRow.fields.cta1_text ?? ""),
        cta1Link: String(heroRow.fields.cta1_link ?? ""),
        cta2Text: String(heroRow.fields.cta2_text ?? ""),
        cta2Link: String(heroRow.fields.cta2_link ?? ""),
      }
    : null;

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
    public: Boolean(r.fields.public ?? r.fields.publish),
  }));

  return { hero, homeAbout, numbers };
}

export const revalidate = 0;

export default async function AdminHomePage() {
  const data = await getHomeData();
  return <HomeClient {...data} />;
}
