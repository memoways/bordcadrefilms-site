# Bord Cadre Films

Production website for [Bord Cadre Films](https://bordcadrefilms.com), a Geneva-based independent film production company. Replaces a Dorik + client-side Airtable setup that suffered from slow loads, display bugs, and exposed API credentials in the browser.

---

## Table of Contents

1. [Stack](#stack)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Data Layer](#data-layer)
5. [Admin CMS](#admin-cms)
6. [Caching Strategy](#caching-strategy)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [Scripts](#scripts)
10. [CI / CD](#ci--cd)
11. [Git Workflow](#git-workflow)
12. [Key Documents](#key-documents)

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.1 |
| Language | TypeScript (strict) | 5 |
| Styling | Tailwind CSS | v4 |
| UI interactions | React | 19.2.4 |
| Drag & drop | @dnd-kit/core + sortable | 6 / 10 |
| Data source | Airtable REST API | server-side only |
| Auth | Clerk | 7 |
| Testing | Playwright | 1.59 |
| Runtime | Node.js | 22 |
| Hosting | Vercel | — |

---

## Architecture

### Rendering model

```
Airtable REST API
      │
      ▼  (server-side only, credentials never in client bundle)
Next.js Server Components  ──→  Static HTML (SSG)
      │                               │
      │  ISR revalidate (time-based)  │  Vercel CDN edge cache
      │◄──────────────────────────────┘
      │
      ▼
On-demand revalidation
POST /api/admin/revalidate  (Clerk-authenticated)
revalidateTag('site-config' | 'team' | 'films' | …)
```

### Request flow — public page

```
Visitor  →  Vercel CDN
              ├─ Cache hit  →  HTML served in ~10ms
              └─ Cache miss →  Next.js server
                                ├─ Server Component renders
                                ├─ React cache() deduplicates fetches per request
                                ├─ Next.js Data Cache (fetch + revalidate tag)
                                └─ HTML + RSC payload cached on CDN
```

### Request flow — admin mutation

```
Editor  →  /admin/*  (Clerk session required)
              └─  AdminClient  →  PATCH /api/admin/records/[table]
                                        └─  Airtable REST API
                                  POST /api/admin/revalidate
                                        └─  revalidateTag(tag)
                                              └─  CDN cache flushed
```

### Client-side navigation

Router Cache (`staleTimes: { dynamic: 900, static: 900 }`) keeps prefetched route payloads warm for 15 minutes. Navigation between cached routes is instant with no server round-trip.

---

## Project Structure

```
bordcadre-films/
│
├── app/
│   ├── layout.tsx                    Root layout — Header, Footer, fonts
│   ├── page.tsx                      Home (ISR 3600s)
│   ├── globals.css                   CSS variables, Tailwind theme tokens
│   │
│   ├── about/
│   │   └── page.tsx                  About page (ISR 3600s)
│   │
│   ├── completed-films/
│   │   ├── page.tsx                  Film catalogue (ISR 900s)
│   │   ├── loading.tsx               Skeleton shown during navigation
│   │   └── [slug]/
│   │       ├── page.tsx              Film detail (SSG + ISR 900s)
│   │       └── loading.tsx
│   │
│   ├── directors/
│   │   ├── page.tsx                  Directors listing (ISR 900s)
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx              Director detail with gallery + filmography
│   │       └── loading.tsx
│   │
│   ├── news/
│   │   ├── page.tsx                  News listing (ISR 1800s)
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx              News article detail
│   │       └── loading.tsx
│   │
│   ├── contact/
│   │   ├── page.tsx
│   │   ├── ContactForm.tsx           Client component with validation
│   │   └── actions.ts                Server Action for form submission
│   │
│   ├── admin/                        Clerk-protected CMS
│   │   ├── sign-in/[[...sign-in]]/   Clerk hosted sign-in UI
│   │   ├── (protected)/
│   │   │   ├── layout.tsx            Auth guard + AdminSidebar shell
│   │   │   ├── page.tsx              Dashboard — stats, quick actions, ISR flush
│   │   │   ├── home/                 Edit hero video, about bloc, BCF numbers
│   │   │   ├── about/                Edit about intro text, founder bio, festival gallery
│   │   │   └── team/                 Add / edit / reorder / publish team members
│   │   ├── components/
│   │   │   ├── AdminSidebar.tsx      Nav sidebar (active state via usePathname)
│   │   │   ├── AdminField.tsx        Reusable input / textarea field
│   │   │   └── AdminToast.tsx        Success / error notification
│   │   └── lib/
│   │       └── api.ts                Client-side helpers: adminPatch/Post/Delete/Revalidate
│   │
│   ├── api/
│   │   ├── hero-video/route.ts       GET — hero video data
│   │   ├── home-about/route.ts       GET — home about bloc
│   │   ├── home-news/route.ts        GET — recent news (3 items)
│   │   ├── bcf-numbers/route.ts      GET — BCF stat counters
│   │   ├── about-bio/route.ts        GET — founder bio
│   │   ├── team/route.ts             GET — team members
│   │   ├── festival-photos/route.ts  GET — festival gallery
│   │   ├── revalidate/route.ts       POST — public ISR revalidation webhook
│   │   └── admin/
│   │       ├── revalidate/route.ts   POST — authenticated ISR flush (Clerk)
│   │       └── records/[table]/      GET/PATCH/POST/DELETE — Airtable CRUD proxy (Clerk)
│   │
│   ├── components/                   Shared presentational components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HomeHero.tsx              Full-screen video hero
│   │   ├── HomeAboutSection.tsx      About teaser on home
│   │   ├── HomeNewsSection.tsx       News carousel on home (async Server Component)
│   │   ├── HomeFilmGridPreview.tsx   Film grid preview on home
│   │   ├── HomeDirectorsPreview.tsx  Directors preview on home
│   │   ├── FilmCard.tsx
│   │   ├── FilmGrid.tsx
│   │   ├── FilmGridClient.tsx        Client component — search + filter state
│   │   ├── FilmGridSkeleton.tsx
│   │   ├── FilmFilters.tsx           Year / genre / country dropdowns
│   │   ├── FilmDetail.tsx            Full film detail layout
│   │   ├── FilmDetailSkeleton.tsx
│   │   ├── DirectorCard.tsx
│   │   ├── DirectorGrid.tsx
│   │   ├── DirectorGridSkeleton.tsx
│   │   ├── GalleryCarousel.tsx       Shared image carousel (film detail + About gallery)
│   │   ├── NewsCarousel.tsx
│   │   ├── NewsCarouselSkeleton.tsx
│   │   ├── AboutIntro.tsx            About page intro text section
│   │   ├── AboutFounderBio.tsx
│   │   ├── AboutTeamCarousel.tsx
│   │   ├── AboutCarouselGallery.tsx  Festival photos carousel
│   │   └── AboutCounters.tsx         BCF stat counters
│   │
│   └── lib/                          Server-side data helpers (never imported by client)
│       ├── airtable.ts               Films & directors fetch + type definitions
│       ├── catalog.ts                getFilms(), getDirectors() with React cache()
│       ├── hero.ts                   readHeroVideo()
│       ├── home.ts                   readHomeAbout(), readBCFNumbers(), readHomeNews()
│       ├── about.ts                  readFounderBio(), readTeam(), readFestivalPhotos()
│       ├── news.ts                   readNews(), readNewsItem()
│       ├── utils.ts                  firstString(), getValidImageUrl(), slugify()
│       ├── mock-data.ts              Fallback data (active until Airtable tables are live)
│       └── mock/                     Per-table JSON fallback files
│           ├── hero.json
│           ├── home-about.json
│           ├── bcf-numbers.json
│           ├── news.json
│           ├── founder.json
│           ├── team.json
│           └── festival-photos.json
│
├── e2e/                              Playwright end-to-end tests
│   ├── home.spec.ts
│   ├── films.spec.ts
│   ├── navigation.spec.ts
│   └── contact.spec.ts
│
├── public/
│   ├── logo-bcf.svg
│   ├── news/                         Placeholder news images (news-1/2/3.png)
│   └── fonts/                        Self-hosted web fonts (Open Sans, Aleo — woff2 only)
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    Lint → type-check → build → Playwright
│   │   ├── deploy.yml                Coolify webhooks (main → prod, develop → staging)
│   │   └── security.yml              npm audit weekly + on PR
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.yml
│   │   └── task.yml
│   ├── CODEOWNERS                    @smm69 required on all PRs
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml                Weekly npm + Actions updates
│
├── next.config.ts                    staleTimes 900s, Airtable image domains
├── tsconfig.json                     strict mode, @/* path alias
├── playwright.config.ts              Chromium, webServer CI, retries
├── eslint.config.mjs
├── postcss.config.mjs
├── .nvmrc                            Node 22
├── .gitattributes
├── .env.local.example
│
└── docs/
    ├── CLAUDE.md                     AI agent instructions for this codebase
    ├── AGENTS.md                     Always read Next.js docs before coding
    ├── BEST_PRACTICES.md             Design tokens, component rules, Tailwind v4 syntax
    ├── GIT_WORKFLOW.md               Branch model, commit conventions, CI/CD
    ├── AIRTABLE_SCHEMA.md            CMS table definitions and field contracts
    └── AIRTABLE_TABLES_SETUP.md      Step-by-step Airtable table creation guide
```

> Docs files listed above live at the repo root, not in a `docs/` subfolder.

---

## Data Layer

### Two Airtable bases

| Base | Env var | Purpose |
|---|---|---|
| Films & Directors | `AIRTABLE_BASE_ID` | Existing production catalogue |
| CMS editorial | `AIRTABLE_CMS_BASE_ID` | Home, About, Team, News content |

### Lib helpers

All data fetching lives in `app/lib/`. No component imports Airtable directly.

| Helper | Functions | Cache tag |
|---|---|---|
| `catalog.ts` | `getFilms()`, `getDirectors()` | `films`, `directors` |
| `hero.ts` | `readHeroVideo()` | `hero-video` |
| `home.ts` | `readHomeAbout()`, `readBCFNumbers()`, `readHomeNews()` | `site-config`, `bcf-numbers`, `home-news` |
| `about.ts` | `readFounderBio()`, `readTeam()`, `readFestivalPhotos()` | `site-config`, `team`, `festival-photos` |
| `news.ts` | `readNews()`, `readNewsItem()` | `news` |

Every helper uses React `cache()` for per-request deduplication and Next.js `fetch` with `next: { revalidate, tags }` for persistent server-side caching.

### Mock fallback

Until each Airtable CMS table is created, helpers fall back to `app/lib/mock/*.json`. No crashes, no 500s — the site runs fully on mock data out of the box. See `AIRTABLE_TABLES_SETUP.md` for the creation guide.

---

## Admin CMS

Access: `/admin` — requires Clerk authentication.

| Section | Route | Edits |
|---|---|---|
| Dashboard | `/admin` | Stats, quick actions, per-tag ISR flush |
| Home | `/admin/home` | Hero video, about bloc, BCF stat counters |
| About | `/admin/about` | About intro text, founder bio, festival gallery |
| Team | `/admin/team` | Add / edit / reorder / publish team members |

Films and News are managed directly in Airtable — no admin UI for them.

### Admin API routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/admin/revalidate` | Clerk | Flush ISR cache by tag |
| `GET/PATCH/POST/DELETE /api/admin/records/[table]` | Clerk | Airtable CRUD proxy |

Allowed tables in the CRUD proxy: `SiteConfig`, `BCFNumbers`, `Team`, `FestivalPhotos`.

---

## Caching Strategy

### Server-side (Next.js Data Cache)

| Surface | `revalidate` | Tags |
|---|---|---|
| Films & directors | 900s | `films`, `directors` |
| Home news | 1800s | `home-news` |
| Hero, about, numbers | 3600s | `hero-video`, `site-config`, `bcf-numbers` |
| Team, gallery | 3600s | `team`, `festival-photos` |
| Admin pages | 0 (always fresh) | — |

### Client-side (Router Cache)

`staleTimes: { dynamic: 900, static: 900 }` — route payloads stay warm for 15 minutes. Back/forward navigation and repeat visits within that window are instant with zero network requests.

### On-demand invalidation

`POST /api/admin/revalidate` with `{ "tag": "team" }` flushes the matching cache tag immediately. The admin dashboard exposes buttons for each tag.

---

## Getting Started

### Prerequisites

- Node.js 22 (`nvm use` reads `.nvmrc` automatically)
- An Airtable account with the Films base access

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.local.example .env.local
# Fill in your values — see Environment Variables section below
```

### Develop

```bash
npm run dev
```

- Public site: http://localhost:3000
- Admin CMS: http://localhost:3000/admin

### Build

```bash
npm run build
npm start
```

---

## Environment Variables

```env
# ── Airtable — Films & Directors (existing base) ─────────────────────────
AIRTABLE_API_KEY=pat_xxxxxxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Films
AIRTABLE_VIEW_NAME=Movie BCf website

# ── Airtable — CMS editorial base ────────────────────────────────────────
# Can be the same base as above if you use a single base
AIRTABLE_CMS_BASE_ID=appXXXXXXXXXXXXXX

# Optional — only set if your CMS table names differ from the defaults
# AIRTABLE_HERO_TABLE_NAME=HeroVideo
# AIRTABLE_NUMBERS_TABLE=BCFNumbers
# AIRTABLE_NEWS_TABLE=News
# AIRTABLE_FOUNDER_TABLE=Founder
# AIRTABLE_TEAM_TABLE=Team
# AIRTABLE_FESTIVAL_PHOTOS_TABLE=FestivalPhotos

# ── Clerk — admin authentication ─────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
CLERK_SECRET_KEY=sk_live_xxxx
```

> Airtable credentials are **server-side only** — they are never included in the client bundle.

---

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Playwright e2e (headless Chromium)
npm run test:ui      # Playwright interactive UI
npm run test:debug   # Playwright debug mode
```

---

## CI / CD

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | PR to `main`/`develop`, push to `develop` | Lint → type-check → build → Playwright e2e |
| `deploy.yml` | Push to `main` (prod) or `develop` (staging) | Coolify webhook deploy |
| `security.yml` | Weekly + PR | `npm audit --audit-level=high` |

### Required GitHub secrets

| Secret | Used by |
|---|---|
| `AIRTABLE_API_KEY` | CI build + e2e |
| `AIRTABLE_BASE_ID` | CI build + e2e |
| `AIRTABLE_TABLE_NAME` | CI build + e2e |
| `AIRTABLE_VIEW_NAME` | CI build + e2e |
| `COOLIFY_WEBHOOK_URL` | deploy.yml prod |
| `COOLIFY_WEBHOOK_TOKEN` | deploy.yml prod |
| `COOLIFY_STAGING_WEBHOOK_URL` | deploy.yml staging |
| `COOLIFY_STAGING_WEBHOOK_TOKEN` | deploy.yml staging |

Set secrets at **github.com/memoways/bordcadrefilms-site → Settings → Secrets and variables → Actions**.

---

## Git Workflow

```
main          ← production — auto-deploys to bordcadrefilms.com
 └─ develop   ← staging — auto-deploys to staging.bordcadrefilms.com
     └─ feat/* fix/* chore/*   ← short-lived branches
```

See `GIT_WORKFLOW.md` for commit conventions, PR rules, and branch naming.

### Active branches

| Branch | Purpose |
|---|---|
| `main` | Production |
| `develop` | Integration / staging |
| `feat/airtable-cms-tables` | Create the 7 CMS tables in Airtable, replace all mock data |
| `feat/admin-gallery` | Build `/admin/gallery` page |
| `feat/seo-metadata` | `generateMetadata()` + OpenGraph for all public pages |
| `feat/film-filters-url-sync` | Sync film search/filter state to URL query params |
| `fix/line-endings` | Normalise CRLF → LF across the codebase |
| `chore/vercel-deploy` | Vercel project config, env vars, deploy hooks |

---

## Key Documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Instructions for AI agents working in this codebase |
| `BEST_PRACTICES.md` | Design tokens, component patterns, Tailwind v4 syntax |
| `GIT_WORKFLOW.md` | Branching, commits, CI/CD, PR rules |
| `AIRTABLE_SCHEMA.md` | CMS table definitions, field contracts, status tracker |
| `AIRTABLE_TABLES_SETUP.md` | Step-by-step guide to create each Airtable table |
