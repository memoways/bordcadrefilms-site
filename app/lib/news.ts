import { cache } from "react";
import newsJson from "./mock/news.json";

export type NewsItem = {
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

const NEWS_ITEMS: NewsItem[] = newsJson.map((item) => ({
  slug: item.slug,
  title: item.title,
  director: item.director,
  excerpt: item.excerpt,
  content: item.content,
  status: item.status as NewsItem["status"],
  image: item.image,
  location: item.location,
  publishedAt: item.publishedAt,
}));

export const getNews = cache(async (): Promise<NewsItem[]> => {
  return NEWS_ITEMS;
});

export const getNewsBySlug = cache(async (slug: string): Promise<NewsItem | undefined> => {
  return NEWS_ITEMS.find((item) => item.slug === slug);
});
