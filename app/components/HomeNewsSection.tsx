import NewsCarousel from "./NewsCarousel";

type NewsItemFromAPI = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  status: string;
  publishedAt: string;
  order: number;
};

type NewsItemForCarousel = {
  slug: string;
  title: string;
  director: string;
  excerpt: string;
  content: string[];
  status: "Currently shooting" | "In post-production" | "Festival premiere";
  image: string;
  location: string;
  publishedAt: string;
};

export default async function HomeNewsSection() {
  try {
    const res = await fetch(new URL("/api/home-news", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000").toString(), {
      next: { revalidate: 1800, tags: ["home-news"] },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = (await res.json()) as {
      ok: boolean;
      data?: {
        items: NewsItemFromAPI[];
        total: number;
        source: string;
      };
      error?: string;
    };

    if (!json.ok || !json.data?.items) throw new Error(json.error || "No data");

    const items: NewsItemForCarousel[] = json.data.items.map((item) => ({
      slug: item.slug,
      title: item.title,
      director: "Bord Cadre Films",
      excerpt: item.excerpt,
      content: [item.excerpt],
      status: (item.status as "Currently shooting" | "In post-production" | "Festival premiere") || "In post-production",
      image: item.image,
      location: "International",
      publishedAt: item.publishedAt,
    }));

    return <NewsCarousel items={items} />;
  } catch (error) {
    console.error("[HomeNewsSection] Error:", error);
    return <NewsCarousel items={[]} />;
  }
}
