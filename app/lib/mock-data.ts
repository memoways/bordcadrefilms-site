/**
 * Mock data module — replaces Airtable CMS tables that haven't been created yet.
 * Once each Airtable table is live, update the corresponding lib file to
 * remove the mock import and rely on the real Airtable fetch instead.
 *
 * Tables covered here (Films & Directors are already live in Airtable):
 *   HeroVideo    → hero.ts
 *   HomeAbout    → home.ts
 *   BCFNumbers   → home.ts
 *   News         → news.ts
 *   Founder      → about.ts
 *   FestivalPhotos → about.ts
 * (Team is now live in Airtable — no mock needed)
 */

import heroJson from "./mock/hero.json";
import homeAboutJson from "./mock/home-about.json";
import bcfNumbersJson from "./mock/bcf-numbers.json";
import newsJson from "./mock/news.json";
import founderJson from "./mock/founder.json";
import festivalPhotosJson from "./mock/festival-photos.json";

import type { HeroVideoData } from "./hero";
import type { HomeAboutData, BCFNumbersData, NewsItemData } from "./home";
import type { FounderBioData, FestivalPhotoData } from "./about";
import type { NewsItem } from "./news";

// ─── Hero ────────────────────────────────────────────────────────────────────

export const MOCK_HERO: HeroVideoData = {
  videoUrl: heroJson.videoUrl,
  posterUrl: heroJson.posterUrl,
  title: heroJson.title,
  subtitle: heroJson.subtitle,
  source: "fallback",
};

// ─── Home About ──────────────────────────────────────────────────────────────

export const MOCK_HOME_ABOUT: HomeAboutData = {
  title: homeAboutJson.title,
  subtitle: homeAboutJson.subtitle,
  description: homeAboutJson.description,
  cta_text: homeAboutJson.cta_text,
  cta_link: homeAboutJson.cta_link,
  source: "fallback",
};

// ─── BCF Numbers ─────────────────────────────────────────────────────────────

export const MOCK_BCF_NUMBERS: BCFNumbersData[] = bcfNumbersJson.map((item) => ({
  number: item.number,
  label: item.label,
  description: item.description,
  order: item.order,
}));

// ─── News ─────────────────────────────────────────────────────────────────────

export const MOCK_NEWS: NewsItemData[] = newsJson.map((item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt,
  image: item.image,
  status: item.status,
  publishedAt: item.publishedAt,
  order: item.order,
}));

// NewsItem shape (used by news.ts — includes director, content, location)
export const MOCK_NEWS_ITEMS: NewsItem[] = newsJson.map((item) => ({
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

// ─── Founder ─────────────────────────────────────────────────────────────────

export const MOCK_FOUNDER: FounderBioData = {
  name: founderJson.name,
  title: founderJson.title,
  bio: founderJson.bio,
  image: founderJson.image ?? undefined,
  source: "fallback",
};

// ─── Festival Photos ─────────────────────────────────────────────────────────

export const MOCK_FESTIVAL_PHOTOS: FestivalPhotoData[] = festivalPhotosJson.map((photo) => ({
  id: photo.id,
  title: photo.title,
  description: photo.description ?? undefined,
  image: photo.image,
  festival: photo.festival ?? undefined,
  year: photo.year ?? undefined,
  order: photo.order,
}));
