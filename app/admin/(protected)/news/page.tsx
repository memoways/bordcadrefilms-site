import NewsClientLoader from "./NewsClientLoader";
import type { NewsRow } from "./NewsClient";
import { firstString, getValidImageUrl } from "../../../lib/utils";

const TABLE = process.env.AIRTABLE_NEWS_TABLE ?? "News";

async function getNewsData(): Promise<NewsRow[]> {
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
    slug: firstString(r.fields.slug) ?? "",
    title: firstString(r.fields.title) ?? "",
    director: firstString(r.fields.director) ?? "",
    excerpt: firstString(r.fields.excerpt) ?? "",
    content: firstString(r.fields.content) ?? "",
    status: firstString(r.fields.status) ?? "Currently shooting",
    location: firstString(r.fields.location) ?? "",
    publishedAt: firstString(r.fields.publishedAt) ?? "",
    link: firstString(r.fields.link) ?? "",
    imageUrl: getValidImageUrl(r.fields.image) ?? "",
    order: typeof r.fields.order === "number" ? r.fields.order : i + 1,
    public: Boolean(r.fields.public ?? r.fields.publish),
  }));
}

export const revalidate = 0;

export default async function AdminNewsPage() {
  const items = await getNewsData();
  return <NewsClientLoader initialItems={items} table={TABLE} />;
}
