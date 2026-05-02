import { cache } from "react";
import { firstString, getValidImageUrl } from "./utils";
const FALLBACK_FOUNDER = {
  name: "Bord Cadre Films",
  title: "Founder",
  bio: "Founded in 2008 in Geneva, Bord Cadre Films supports filmmakers from around the world in developing, financing, and producing ambitious arthouse films. The company has established itself as a key player in European independent cinema, with a constant presence at major international festivals — Cannes, Venice, Locarno, Berlin.",
  source: "fallback" as const,
};

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export type FounderBioData = {
  name: string;
  title: string;
  bio: string;
  image?: string;
  source: "airtable" | "fallback";
};

export type TeamMemberData = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: string;
  order: number;
  public: boolean;
};

export type FestivalPhotoData = {
  id: string;
  title: string;
  description?: string;
  image: string;
  festival?: string;
  year?: string;
  order: number;
  public: boolean;
};

export type TeamResponse = {
  members: TeamMemberData[];
  total: number;
  source: "airtable" | "fallback";
};

export type FestivalPhotosResponse = {
  photos: FestivalPhotoData[];
  total: number;
  source: "airtable" | "fallback";
};

function fallbackBio(): FounderBioData {
  return FALLBACK_FOUNDER;
}

export const readFounderBio = cache(async function readFounderBio(): Promise<FounderBioData> {
  if (!BASE_ID || !API_KEY) return fallbackBio();

  try {
    // Fetch all SiteConfig rows — no filterByFormula so the URL is stable
    // and Next.js fetch cache can be shared across hero/home/founder callers.
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent("SiteConfig")}`
    );
    url.searchParams.set("maxRecords", "10");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 86400, tags: ["site-config"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    const fields = data.records?.find(
      (r) => typeof r.fields?.section === "string" && r.fields.section === "founder"
    )?.fields;
    if (!fields) return fallbackBio();

    return {
      name: firstString(fields.name) || "Bord Cadre Films",
      title: firstString(fields.title) || "Founder",
      bio: firstString(fields.bio) || fallbackBio().bio,
      image: getValidImageUrl(fields.image),
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Founder Bio fetch error:", error);
    return fallbackBio();
  }
});

export const readTeam = cache(async function readTeam(): Promise<TeamResponse> {
  if (!BASE_ID || !API_KEY) {
    return { members: [], total: 0, source: "airtable" };
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_TEAM_TABLE || "Team"
      )}`
    );

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 3600, tags: ["team"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ id: string; fields?: Record<string, unknown> }>;
    };

    if (!data.records || data.records.length === 0) {
      return { members: [], total: 0, source: "airtable" };
    }

    const members: TeamMemberData[] = data.records
      .map((record, idx) => ({
        id: record.id,
        name: firstString(record.fields?.name) || `Member ${idx + 1}`,
        role: firstString(record.fields?.role) || "Team Member",
        bio: firstString(record.fields?.bio),
        image: getValidImageUrl(record.fields?.image),
        order: typeof record.fields?.order === "number" ? record.fields.order : idx + 1,
        public: record.fields?.public === true || record.fields?.publish === true,
      }))
      .filter((m) => m.public)
      .sort((a, b) => a.order - b.order);

    return {
      members,
      total: members.length,
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Team fetch error:", error);
    return { members: [], total: 0, source: "airtable" };
  }
});

export const readFestivalPhotos = cache(async function readFestivalPhotos(): Promise<FestivalPhotosResponse> {
  if (!BASE_ID || !API_KEY) {
    return { photos: [], total: [].length, source: "fallback" };
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_FESTIVAL_PHOTOS_TABLE || "FestivalPhotos"
      )}`
    );

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 3600, tags: ["festival-photos"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ id: string; fields?: Record<string, unknown> }>;
    };

    if (!data.records || data.records.length === 0) {
      return { photos: [], total: [].length, source: "fallback" };
    }

    const photos: FestivalPhotoData[] = data.records
      .map((record, idx) => ({
        id: record.id,
        title: firstString(record.fields?.title) || "Festival Photo",
        description: firstString(record.fields?.description),
        image: getValidImageUrl(record.fields?.image) || "/festival/placeholder.png",
        festival: firstString(record.fields?.festival),
        year: firstString(record.fields?.year),
        order: typeof record.fields?.order === "number" ? record.fields.order : idx + 1,
        public: record.fields?.public === true || record.fields?.publish === true,
      }))
      .filter((p) => p.public)
      .sort((a, b) => a.order - b.order);

    return {
      photos,
      total: photos.length,
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Festival Photos fetch error:", error);
    return { photos: [], total: [].length, source: "fallback" };
  }
});
