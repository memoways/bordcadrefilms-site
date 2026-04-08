import { cache } from "react";
import { MOCK_FOUNDER, MOCK_TEAM, MOCK_FESTIVAL_PHOTOS } from "./mock-data";

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
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
};

export type FestivalPhotoData = {
  id: string;
  title: string;
  description?: string;
  image: string;
  festival?: string;
  year?: string;
  order: number;
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
  return MOCK_FOUNDER;
}

function stringOrUndefined(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
  return undefined;
}

function firstImageUrl(v: unknown): string | undefined {
  if (!Array.isArray(v) || v.length === 0) return undefined;
  const first = v[0] as { url?: unknown };
  if (typeof first.url === "string") return first.url;
  return undefined;
}

export const readFounderBio = cache(async function readFounderBio(): Promise<FounderBioData> {
  if (!BASE_ID || !API_KEY) return fallbackBio();

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_FOUNDER_TABLE || "Founder"
      )}`
    );
    url.searchParams.set("maxRecords", "1");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 86400, tags: ["founder-bio"] },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = (await res.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    const fields = data.records?.[0]?.fields;
    if (!fields) return fallbackBio();

    return {
      name: stringOrUndefined(fields.name) || "Bord Cadre Films",
      title: stringOrUndefined(fields.title) || "Fondateur",
      bio: stringOrUndefined(fields.bio) || fallbackBio().bio,
      image: firstImageUrl(fields.image),
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Founder Bio fetch error:", error);
    return fallbackBio();
  }
});

export const readTeam = cache(async function readTeam(): Promise<TeamResponse> {
  if (!BASE_ID || !API_KEY) {
    return { members: MOCK_TEAM, total: MOCK_TEAM.length, source: "fallback" };
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
      return { members: MOCK_TEAM, total: MOCK_TEAM.length, source: "fallback" };
    }

    const members: TeamMemberData[] = data.records
      .map((record, idx) => ({
        id: record.id,
        name: stringOrUndefined(record.fields?.name) || `Member ${idx + 1}`,
        role: stringOrUndefined(record.fields?.role) || "Team Member",
        bio: stringOrUndefined(record.fields?.bio),
        image: firstImageUrl(record.fields?.image),
        order: typeof record.fields?.order === "number" ? record.fields.order : idx + 1,
      }))
      .sort((a, b) => a.order - b.order);

    return {
      members,
      total: members.length,
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Team fetch error:", error);
    return { members: MOCK_TEAM, total: MOCK_TEAM.length, source: "fallback" };
  }
});

export const readFestivalPhotos = cache(async function readFestivalPhotos(): Promise<FestivalPhotosResponse> {
  if (!BASE_ID || !API_KEY) {
    return { photos: MOCK_FESTIVAL_PHOTOS, total: MOCK_FESTIVAL_PHOTOS.length, source: "fallback" };
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
      return { photos: MOCK_FESTIVAL_PHOTOS, total: MOCK_FESTIVAL_PHOTOS.length, source: "fallback" };
    }

    const photos: FestivalPhotoData[] = data.records
      .map((record, idx) => ({
        id: record.id,
        title: stringOrUndefined(record.fields?.title) || "Festival Photo",
        description: stringOrUndefined(record.fields?.description),
        image: firstImageUrl(record.fields?.image) || "/festival/placeholder.png",
        festival: stringOrUndefined(record.fields?.festival),
        year: stringOrUndefined(record.fields?.year),
        order: typeof record.fields?.order === "number" ? record.fields.order : idx + 1,
      }))
      .sort((a, b) => a.order - b.order);

    return {
      photos,
      total: photos.length,
      source: "airtable",
    };
  } catch (error) {
    console.error("[Airtable] Festival Photos fetch error:", error);
    return { photos: MOCK_FESTIVAL_PHOTOS, total: MOCK_FESTIVAL_PHOTOS.length, source: "fallback" };
  }
});
