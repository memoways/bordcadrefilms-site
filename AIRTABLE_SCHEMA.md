# Airtable CMS — Table Schema Documentation

This document defines every Airtable table that needs to be created for the BCF website CMS.  
**Films** and **Directors** are already live — they are not listed here.

When a table is created, remove the corresponding mock file from `app/lib/mock/` and update the
lib function to remove the mock import.

---

## Status tracker

| Table | Env var override | Mock file | Live? |
|---|---|---|---|
| HeroVideo | `AIRTABLE_HERO_TABLE_NAME` | `app/lib/mock/hero.json` | ❌ |
| HomeAbout | `AIRTABLE_HOME_ABOUT_TABLE` | `app/lib/mock/home-about.json` | ❌ |
| BCFNumbers | `AIRTABLE_NUMBERS_TABLE` | `app/lib/mock/bcf-numbers.json` | ❌ |
| News | `AIRTABLE_NEWS_TABLE` | `app/lib/mock/news.json` | ❌ |
| Founder | `AIRTABLE_FOUNDER_TABLE` | `app/lib/mock/founder.json` | ❌ |
| Team | `AIRTABLE_TEAM_TABLE` | `app/lib/mock/team.json` | ❌ |
| FestivalPhotos | `AIRTABLE_FESTIVAL_PHOTOS_TABLE` | `app/lib/mock/festival-photos.json` | ❌ |

---

## 1. HeroVideo

**Purpose:** Controls the full-screen video hero on the home page.  
**Consumer:** `app/lib/hero.ts` → `app/components/HomeHero.tsx`  
**Env var:** `AIRTABLE_HERO_TABLE_NAME` (default: `"HeroVideo"`)  
**Revalidation:** 1 hour (`revalidate: 3600`, tag: `hero-video`)  
**Max records fetched:** 1 (first record only)

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `title` | Single line text | ✅ | Displayed as `<h1>` over the video |
| `subtitle` | Long text | ✅ | One paragraph below the title |
| `videoUrl` | URL | ✅ | Direct `.mp4` URL (CDN or attachment) |
| `posterUrl` | URL | — | Poster image shown before video loads |
| `videoFile` | Attachment | — | Alternative to `videoUrl` — first attachment used |
| `poster` | Attachment | — | Alternative to `posterUrl` — first attachment used |

> Only **one record** is used. Create a single row and update it in place.

---

## 2. HomeAbout

**Purpose:** Short editorial bloc on the home page ("About" teaser section).  
**Consumer:** `app/lib/home.ts` → `app/components/HomeAboutSection.tsx` via `/api/home-about`  
**Env var:** `AIRTABLE_HOME_ABOUT_TABLE` (default: `"HomeAbout"`)  
**Revalidation:** 1 hour (`revalidate: 3600`, tag: `home-about`)  
**Max records fetched:** 1

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `title` | Single line text | ✅ | Section heading |
| `subtitle` | Single line text | — | Smaller line below heading (e.g. "Depuis 2008") |
| `description` | Long text | ✅ | 2–3 sentence editorial paragraph |
| `cta_text` | Single line text | — | Button label (default: "En savoir plus") |
| `cta_link` | URL | — | Button destination (default: `/about`) |
| `background_image` | URL | — | Optional background image URL |

---

## 3. BCFNumbers

**Purpose:** Key statistics displayed as counters (films produced, directors, festivals, founded year).  
**Consumer:** `app/lib/home.ts` → `app/components/AboutCounters.tsx` via `/api/bcf-numbers`  
**Env var:** `AIRTABLE_NUMBERS_TABLE` (default: `"BCFNumbers"`)  
**Revalidation:** 1 hour (`revalidate: 3600`, tag: `bcf-numbers`)

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `number` | Number | ✅ | The numeric value to display |
| `label` | Single line text | ✅ | Short label below the number (e.g. "films produits") |
| `description` | Single line text | — | Tooltip or sub-label (e.g. "Longs et courts métrages") |
| `order` | Number | ✅ | Sort order (ascending) |

> Create 4 rows: films produced, directors, festivals, founding year.

---

## 4. News

**Purpose:** News / project updates articles. Used on home carousel and `/news` listing page.  
**Consumer:** `app/lib/home.ts` (home carousel via `/api/home-news`) + `app/lib/news.ts` (news pages)  
**Env var:** `AIRTABLE_NEWS_TABLE` (default: `"News"`)  
**Revalidation:** 30 min (`revalidate: 1800`, tag: `home-news`)

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `slug` | Single line text | ✅ | URL-safe slug (e.g. `sun-over-rimini`) — must be unique |
| `title` | Single line text | ✅ | Article title |
| `director` | Single line text | ✅ | Director name linked to this news |
| `excerpt` | Long text | ✅ | 1–2 sentence summary for cards and carousel |
| `content` | Long text | — | Full article body (can be multi-paragraph, separated by `\n\n`) |
| `status` | Single select | ✅ | Options: `Currently shooting` / `In post-production` / `Festival premiere` |
| `image` | Attachment | ✅ | Cover image — first attachment used |
| `location` | Single line text | — | City, Country |
| `publishedAt` | Date | ✅ | ISO date (YYYY-MM-DD) — used for sort order |
| `order` | Number | — | Manual sort override (higher = first) |

---

## 5. Founder

**Purpose:** Founder / company bio block on the About page.  
**Consumer:** `app/lib/about.ts` → `app/components/AboutFounderBio.tsx` via `/api/about-bio`  
**Env var:** `AIRTABLE_FOUNDER_TABLE` (default: `"Founder"`)  
**Revalidation:** 24 hours (`revalidate: 86400`, tag: `founder-bio`)  
**Max records fetched:** 1

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `name` | Single line text | ✅ | Person or company name |
| `title` | Single line text | ✅ | Role or subtitle (e.g. "Productrice déléguée") |
| `bio` | Long text | ✅ | Full biography paragraph(s) |
| `image` | Attachment | — | Portrait photo — first attachment used |

---

## 6. Team

**Purpose:** Team members carousel on the About page.  
**Consumer:** `app/lib/about.ts` → `app/components/AboutTeamCarousel.tsx` via `/api/team`  
**Env var:** `AIRTABLE_TEAM_TABLE` (default: `"Team"`)  
**Revalidation:** 1 hour (`revalidate: 3600`, tag: `team`)

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `name` | Single line text | ✅ | Full name |
| `role` | Single line text | ✅ | Job title / role |
| `bio` | Long text | — | Short bio (1–2 sentences) |
| `image` | Attachment | — | Profile photo — first attachment used |
| `order` | Number | ✅ | Sort order (ascending) |

---

## 7. FestivalPhotos

**Purpose:** Gallery carousel of festival photos / press moments on the About page.  
**Consumer:** `app/lib/about.ts` → `app/components/AboutCarouselGallery.tsx` via `/api/festival-photos`  
**Env var:** `AIRTABLE_FESTIVAL_PHOTOS_TABLE` (default: `"FestivalPhotos"`)  
**Revalidation:** 1 hour (`revalidate: 3600`, tag: `festival-photos`)

| Field name | Airtable type | Required | Notes |
|---|---|---|---|
| `title` | Single line text | ✅ | Caption / event name |
| `description` | Long text | — | Longer description shown on hover or below |
| `image` | Attachment | ✅ | Photo — first attachment used |
| `festival` | Single line text | — | Festival name (e.g. "Festival de Cannes") |
| `year` | Single line text | — | 4-digit year string (e.g. `"2025"`) |
| `order` | Number | ✅ | Sort order (ascending) |

---

## How to migrate a table from mock to live

1. Create the table in Airtable with the fields above.
2. Add data rows.
3. In `.env.local`, confirm `AIRTABLE_BASE_ID` and `AIRTABLE_API_KEY` are set.
4. Optionally set the env var override (e.g. `AIRTABLE_NEWS_TABLE=News`) if the table name differs.
5. Test locally — the lib function will now hit Airtable instead of the mock.
6. Delete the corresponding `app/lib/mock/*.json` file.
7. Remove the mock import from the lib file and simplify the fallback if desired.
8. Mark the table as ✅ in the status tracker above.
