import { TeamClient, type TeamMember } from "./TeamClient";

// ── Server data fetch ─────────────────────────────────────────────────────

async function getTeamData(): Promise<TeamMember[]> {
  const BASE = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
  const url = new URL(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(process.env.AIRTABLE_TEAM_TABLE ?? "Team")}`,
  );
  url.searchParams.set("sort[0][field]", "order");
  url.searchParams.set("sort[0][direction]", "asc");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    records?: Array<{ id: string; fields: Record<string, unknown> }>;
  };

  return (data.records ?? []).map((r, i) => {
    const img = r.fields.image;
    let imageUrl = "";
    if (Array.isArray(img) && img.length > 0) {
      const first = img[0] as { url?: string };
      imageUrl = first.url ?? "";
    }
    return {
      id: r.id,
      name: String(r.fields.name ?? ""),
      role: String(r.fields.role ?? ""),
      bio: String(r.fields.bio ?? ""),
      imageUrl,
      order: typeof r.fields.order === "number" ? r.fields.order : i + 1,
      public: Boolean(r.fields.public ?? r.fields.publish),
    };
  });
}

// ── Page (Server Component) ───────────────────────────────────────────────

export const revalidate = 0;

export default async function AdminTeamPage() {
  const members = await getTeamData();
  return <TeamClient initialMembers={members} />;
}
