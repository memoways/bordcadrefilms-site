import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BASE_ID = (process.env.AIRTABLE_CMS_BASE_ID || process.env.AIRTABLE_BASE_ID)!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

// Allowlist — prevents proxying arbitrary Airtable tables
const ALLOWED_TABLES = new Set([
  "SiteConfig",
  "BCFNumbers",
  "Team",
  "FestivalPhotos",
]);

function airtableHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function requireAuth() {
  const { userId } = await auth();
  return userId;
}

// GET /api/admin/records/[table]?maxRecords=100&view=Grid+view
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await params;
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Table not permitted" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);

  // Forward safe query params
  for (const key of ["maxRecords", "view", "offset", "sort[0][field]", "sort[0][direction]"]) {
    const val = searchParams.get(key);
    if (val) url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString(), {
    headers: airtableHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}

// PATCH /api/admin/records/[table]
// Body: { id: string; fields: Record<string, unknown> }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await params;
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Table not permitted" }, { status: 403 });
  }

  const body = (await req.json()) as { id?: string; fields?: Record<string, unknown> };
  if (!body.id || !body.fields) {
    return NextResponse.json({ error: "id and fields are required" }, { status: 400 });
  }

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${body.id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: airtableHeaders(),
    body: JSON.stringify({ fields: body.fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}

// POST /api/admin/records/[table]
// Body: { fields: Record<string, unknown> }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await params;
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Table not permitted" }, { status: 403 });
  }

  const body = (await req.json()) as { fields?: Record<string, unknown> };
  if (!body.fields) {
    return NextResponse.json({ error: "fields are required" }, { status: 400 });
  }

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: airtableHeaders(),
    body: JSON.stringify({ fields: body.fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json(await res.json(), { status: 201 });
}

// DELETE /api/admin/records/[table]?id=recXXX
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await params;
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Table not permitted" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: airtableHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ deleted: id });
}
