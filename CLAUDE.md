# CLAUDE.md — Bord Cadre Films

> Marketing + catalog site for **Bord Cadre Films**, Geneva-based independent film production. Full rebuild of original Dorik site.

---

## 0. Read first

- Auto-memory at `~/.claude/projects/.../memory/MEMORY.md` — read at session start.
- Current branch: `feat/film-videos-press`. See §7 for active sprint.

---

## 1. Hard rules (never violate)

Each item = resolved bug or known footgun.

### Images
- **Never `unoptimized` on `next/image` for Airtable images.** Causes 403s after ~1h (signed URL expiry). Fix: `remotePatterns` + `minimumCacheTTL`. Reverted twice.
- **All Airtable-sourced images go through `app/components/SmartImage.tsx`.** Never `next/image` direct. SmartImage shows pulsing skeleton on failure, dispatches `bcf:image-failed` for `LiveReload`. Static SVGs (logo) can use plain `next/image`.
- **Film images resolve via `/api/img/film/[slug]/[type][?w=N]`** (poster | profile | festival | image-N). Stable same-origin URL → HTML never holds dying signed URL. Route uses `sharp` to downscale to `?w=` (snapped to allowed bucket: `[80, 144, 256, 320, 384, 640, 1024, 2000]`) — defaults to 2000 if `w` omitted. q82 mozjpeg. Route MUST stay on `runtime = 'nodejs'` (sharp native bindings). Output wrapped in `unstable_cache` (1h TTL, tag `films`, key includes width) — base64 stored, not raw Buffer (JSON-serialized). Width snapping is required: bounds cache cardinality + prevents `?w=anything` cache-poisoning.
- **SmartImage does NOT mark `/api/img/` URLs `unoptimized`** — `/_next/image` wraps `/api/img/.../poster` to generate AVIF/WebP at srcset widths. Without this, browsers receive 2000px / 1+MB blobs for 320px card slots (verified 2026-05-02: 6.5MB payload, 1.3s avg per image). Vercel transformation cost (~1 per width per image, cached 1h) is far cheaper than the bandwidth waste. Only set `unoptimized={true}` when bypassing optimizer is intentional (e.g. og:image with manual `?w=`).

### Image debugging — always start at right file
For "image pending", "image broken", "image slow", or rendering bug on specific page, open file owning that surface FIRST. Don't grep blind — map below is canonical:

| Surface | File |
|---|---|
| Films list grid (lazy slice, "Load More", PAGE_SIZE) | `app/components/FilmGridClient.tsx` |
| Films list server wrapper | `app/components/FilmGrid.tsx` |
| Film card (poster, priority, alt) | `app/components/FilmCard.tsx` |
| Film detail (poster, gallery image-N, profile, festival) | `app/components/FilmDetail.tsx` |
| Director page profile + film cards | `app/directors/[slug]/page.tsx` |
| Home hero | `app/components/HomeHero.tsx` |
| Home directors preview | `app/components/HomeDirectorsPreview.tsx` (does NOT use SmartImage today — flag if extending) |
| About counters / team / festival photos | `app/components/AboutCountersClient.tsx`, `app/lib/about.ts` |
| Universal image wrapper (retry, skeleton, unoptimized auto) | `app/components/SmartImage.tsx` |
| Image proxy route (cache + sharp) | `app/api/img/film/[slug]/[type]/route.ts` |
| URL builder (`filmImageUrl`) and shape coercion (`getValidImageUrl`) | `app/lib/utils.ts` |
| Film data + image field shape | `app/lib/airtable.ts` (`_processFilmRecords`, `FILM_FIELDS`) |

### Airtable
- **Pagination requires `do/while` offset loop.** API silently caps at 100 records. Pattern in `app/lib/airtable.ts`; copy for every new table fetch.
- **Airtable calls server-side only.** Never import `app/lib/airtable.ts` (or any helper reading `AIRTABLE_API_KEY`) from `"use client"` component. Pass data as props.
- **Airtable silently drops writes to non-existent columns.** 200 OK does not prove field name right. Round-trip (save → reload → verify) when adding new column.
- **Visibility flag column is `publish`** (boolean) on `News`, `Team`, `BCFNumbers`. Public reads fall back: `Boolean(fields.public ?? fields.publish)` — `public` was original name; `publish` is canonical and what saves write.
- **Airtable rate limit: 5 req/sec/base.** `_readAirtableFilms` splits 6-table fetch into 2 waves of 3 to stay under cap. Don't merge waves back into one `Promise.allSettled` — 429s silently drop media/crew via `allSettled` swallow.

### Routing / layout
- **No nested `<main>`.** `app/layout.tsx` already wraps in `<main>`. Inner pages: `<div>` / `<section>` / `<article>`.
- **Dynamic route params async** (Next 16): `params: Promise<{ slug: string }>` → `await params`. Sync access warns and breaks.
- **Every `[slug]` route exports both `generateStaticParams` and `generateMetadata`.** Both, always.
- **Don't re-create `RouteWarmup`.** Deleted as dead code; ISR handles warming.

### Forms / state — two distinct patterns
- **Public forms** (contact, etc.) use **Server Actions + React 19 `useActionState`** (`actions.ts` + `Form.tsx`). No manual `fetch` + `useState`.
- **Admin (Clerk-gated) editors** use **client `useState` + `adminPatch`/`adminPost`/`adminDelete`** from `app/admin/lib/api.ts`, then call `adminRevalidate("<tag>")` and `router.refresh()`. Tags: `news`, `team`, `bcf-numbers`, `site-config`, `directors`, `films`, `social`, `festival-photos`. Don't introduce Server Actions for admin — existing pattern uniform across all admin pages.
- **Filters/forms must be fully controlled.** Parent owns state, no internal mirror state (drift bug fixed 2026-04-07).
- **DnD-using admin clients (`team`, `social`, `about`) need `mounted` guard.** `@dnd-kit` doesn't render identical markup SSR vs first client render → hydration mismatch. Pattern: `useState(false) + useEffect(() => setMounted(true), [])` and gate DnD subtree on `mounted`. Don't forget `useEffect` in React import (hit during ENOSPC recovery — silent until runtime).

### Tailwind v4 syntax
Silent no-ops if v3 syntax used:
- `bg-linear-to-b` — NOT `bg-gradient-to-b`
- `aspect-2/3` — NOT `aspect-[2/3]`

### Components / architecture
- **Default to Server Components.** `"use client"` only for `useState`, browser APIs, or event handlers.
- **Shared helpers in `app/lib/utils.ts`** (`slugify`, `firstString`, `getValidImageUrl`). Don't re-inline.

---

## 2. Design tokens

| Token | Value |
|---|---|
| Footer bg | `#2B2B2B` |
| Accent / CTA | `#E0A75D` |
| Button text | `#1C1C1C` |
| Body font | `--font-open-sans` → `font-sans` (SuisseIntl) |
| Heading font | `--font-aleo` → `font-[family-name:var(--font-aleo)]` (Aleo) |

Use exact hex via Tailwind arbitrary values (`bg-[#E0A75D]`), not palette aliases.

---

## 3. Stack

**Next.js 16** (App Router) · **React 19** · **Tailwind v4** · **TypeScript**
**Airtable REST** (CMS, base `appKG4TCNxZhF6edh`) · **Clerk** (admin auth)
**Vercel** (preview) · **Coolify** (staging + prod)

Public content (films, directors, news, about, hero, social) — read server-side from Airtable.
Admin mutations — `app/api/admin/records/[table]` (PATCH/POST/DELETE + `revalidateTag`). Allowlist in that route.

---

## 4. Folder structure

```
app/
  (public routes)          page.tsx, films/, directors/[slug], news/[slug], about/, architecture/
  admin/                   Clerk-gated CMS UI (films, directors, news, social, team, festival-photos, bcf-numbers, home/site-config)
  api/
    admin/records/[table]/ Airtable proxy (allowlisted)
    img/film/[slug]/[type]/ Same-origin proxy with sharp resize (Node runtime)
  components/              Server + Client components: SmartImage, LiveReload, FilmGridClient, GalleryCarousel, HomeHero, …
  lib/                     airtable.ts, catalog.ts, hero.ts, home.ts, news.ts, about.ts, social.ts, utils.ts
public/                    Static assets (logo, /Logos/ partner logos)
e2e/                       Playwright tests
docs/, README.md, AIRTABLE_TABLES_SETUP.md, GIT_WORKFLOW.md
```

> Route rename: `/completed-films` → `/films` (commit `9e9f523`). All internal links + `generateStaticParams` updated; old URLs gone.

---

## 5. Git workflow

`feature/*` → PR → test/vercel-ci → `develop` (Coolify staging) → `main` (Coolify prod).
**Never push direct to `main` or `develop`.** See `GIT_WORKFLOW.md`.

---

## 6. Commands

```bash
npm run dev
npm run build
npm run type-check
npm run lint
npm test          # Playwright
```

---

## 7. Active sprint — `feat/film-videos-press` (updated 2026-05-02)

### `/films` bugs (carry-over)

| # | Status | Description |
|---|---|---|
| 1 | 🟠 Likely fixed, unverified | Mobile "Load more" → in-app error. Touched by `e1760d1` + `9e9f523`. Needs real-device repro on Vercel preview. |
| 2 | 🟢 Closed | Gallery expiry. Fixed by `/api/img` proxy (`5488d45`, `9cabe78`). |
| 3 | 🟢 Closed | "Load more" latency. Fixed by `9e9f523`, `e1760d1`. |

### Shipped on this branch (committed)

**Task 1 — Hero in admin/home** ✅ shipped (`7463bd8`).
- Admin section above About on `/admin/home`. 9 fields (`title`, `subtitle`, `description`, `video_url`, `poster_url`, `cta1_text/link`, `cta2_text/link`) stored as `section = "hero"` row in `SiteConfig`.
- Files: `app/lib/hero.ts`, `app/components/HomeHero.tsx`, `app/admin/(protected)/home/page.tsx` + `HomeClient.tsx`.

**Task 2 — `publish` checkbox on News / Team / BCFNumbers** ✅ shipped (`3668611`).
- Admin clients (`NewsClient`, `TeamClient`, `home/HomeClient` BCFNumbers section) all surface `public` boolean checkbox.
- Airtable column added as `publish`.
- Save payload key is `publish:` in News (`NewsClient.tsx:239`, `:302`), Team (`TeamClient.tsx:276`, `:313`), Home BCFNumbers (`HomeClient.tsx:164`). Local `NewsRow`/`TeamRow`/`BCFNumberRow` types intentionally retain `public: boolean` as in-memory field name — local→Airtable mapping happens at save.
- Public reads use `public === true || publish === true` dual-field fallback in all five lib functions: `app/lib/news.ts:91`, `app/lib/about.ts:133` (readTeam), `app/lib/about.ts:185` (readFestivalPhotos), `app/lib/home.ts:138` (readBCFNumbers), `app/lib/home.ts:193` (readHomeNews).

**Task 3 — FilmCard subtitle** ✅ shipped (`0d94cf9`). Original title in red (`text-red-600 text-[10px] uppercase`) shown when differs from EN title; country shown after director with `border-l` divider. See `app/components/FilmCard.tsx:39-47`.

**Task 4 — Films UI cleanup** ✅ shipped (`0d94cf9`).
- Renamed exports to drop `Fixed` suffix in `app/components/{SmartImage,FilmCard,FilmGrid,FilmGridClient}.tsx`. Filenames already clean; consumers used clean local bindings, rename internal-only.
- Deleted `app/films-optimized/` (dead "Fixed comparison" route — bypassed `/api/img` proxy, linked to retired `/completed-films/` path; zero inbound imports).

**Task 5 — Perf fixes** ✅ shipped (`86b5dd5`).
- `_readAirtableFilms` 6-table burst split into 2 waves of 3 (was hitting Airtable 5 req/sec cap → 429s on Media table, silently dropping videos/press kits).
- `/api/img/film` route wraps fetch+sharp in `unstable_cache` (1h, tagged `films`) — eliminates re-download + re-encode on every optimizer cache miss.
- `SmartImage` auto-sets `unoptimized` for `/api/img/` srcs → skips redundant Vercel optimizer pass + per-source transformation charge.

### ENOSPC recovery (2026-05-01)
Disk-full event mid-write truncated `news/page.tsx` and `home/page.tsx` to 0 bytes, dropped `useEffect` from three client imports. Recovered by:
1. Rebuilding both `page.tsx` files with additive Task 1 + Task 2 fields live clients now expect (NOT clean `git checkout HEAD --` — clients had moved on).
2. Adding `useEffect` to `team/`, `social/`, `about/` `*Client.tsx` imports.
3. Fixing `NewsClientLoader` dynamic-import — `NewsClient` is default export, so `() => import("./NewsClient")` (not `.then(mod => mod.NewsClient)`).

`tsc` clean as of recovery. Lesson: ENOSPC produces *partial* writes, not "no change" — re-read every touched file before declaring success.

### Other shipped touch-ups
- `app/api/img/film/[slug]/[type]/route.ts` — `sharp` resize (≤2000 px / q82 mozjpeg) for >3.5 MB or >2000 px upstreams. Adds `sharp@^0.34.5` (`7807c4c`).
- `AboutCountersClient.tsx` — counter spacing tightened (`gap-x-2`) (`e354403`).
- `HomeDirectorsPreview.tsx` — "View all directors" promoted to primary CTA (`e354403`).
- `AdminShell` extracted from layout (`e354403`).

---

## 8. Coding discipline

### Think before coding
- State assumptions explicit. If uncertain, ask — don't guess silently.
- If multiple interpretations exist, surface them before picking one.
- If simpler approach exists, say so. Push back when warranted.

### Simplicity first
- Minimum code that solves problem. Nothing speculative.
- No features, abstractions, or "configurability" beyond what was asked.
- No error handling for impossible scenarios.
- 200 lines that could be 50? Rewrite.

### Surgical changes
- Touch only what task requires. Don't "improve" adjacent code.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete.
- Remove imports/variables/functions that *your* changes made unused. Leave pre-existing dead code alone.

### Goal-driven execution
Transform tasks into verifiable goals before starting:

```
[Step] → verify: [check]
[Step] → verify: [check]
```

- "Fix the bug" → write test that reproduces it, then make it pass.
- "Add validation" → write tests for invalid inputs, then make them pass.
- "Refactor X" → ensure tests pass before and after.

Weak criteria ("make it work") require constant clarification. Strong criteria let you loop independently.
