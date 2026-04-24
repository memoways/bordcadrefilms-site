import NewsClientLoader from "./NewsClientLoader";
import type { NewsRow } from "./NewsClient";

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

  return (data.records ?? []).map((r, i) => {
    const img = r.fields.image;
    let imageUrl = "";
    if (Array.isArray(img) && img.length > 0) {
      const first = img[0] as { url?: string };
      imageUrl = first?.url ?? "";
    } else if (typeof img === "string") {
      imageUrl = img;
    }
    return {
      id: r.id,
      slug: String(r.fields.slug ?? ""),
      title: String(r.fields.title ?? ""),
      director: String(r.fields.director ?? ""),
      excerpt: String(r.fields.excerpt ?? ""),
      content: String(r.fields.content ?? ""),
      status: String(r.fields.status ?? "Currently shooting"),
      location: String(r.fields.location ?? ""),
      publishedAt: String(r.fields.publishedAt ?? ""),
      link: String(r.fields.link ?? ""),
      imageUrl,
      order: typeof r.fields.order === "number" ? r.fields.order : i + 1,
    };
  });
}

export const revalidate = 0;

export default async function AdminNewsPage() {
  const items = await getNewsData();
  return <NewsClientLoader initialItems={items} table={TABLE} />;
}
