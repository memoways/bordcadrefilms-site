# CLAUDE.md — Bord Cadre Films

> Marketing + catalog site for **Bord Cadre Films**, a Geneva-based independent film production company.
> Full rebuild of the original Dorik site.

---

## 0. Read first

- Auto-memory at `~/.claude/projects/.../memory/MEMORY.md` — read it at session start.
- Current branch: `feat/film-videos-press`. See §7 for active sprint.

---

## 1. Hard rules (never violate)

These have already caused regressions. Every item here is a resolved bug or a known footgun.

### Images
- **Never `unoptimized` on `next/image` for Airtable images.** Causes 403s after ~1h (signed URL expiry). Fix: `remotePatterns` + `minimumCacheTTL`. Reverted twice already.
- **All Airtable-sourced images go through `app/components/SmartImage.tsx`.** Never `next/image` directly. SmartImage shows a pulsing skeleton on failure and dispatches `bcf:image-failed` for `LiveReload`. Static SVGs (logo) can use plain `next/image`.
- **Film images resolve via `/api/img/film/[slug]/[type]`** (poster | profile | festival | image-N). Stable same-origin URL → HTML never holds a dying signed URL. Route uses `sharp` to downscale upstream to ≤2000 px / q82 mozjpeg when source >3.5 MB or >2000 px wide. Route MUST stay on `runtime = 'nodejs'` (sharp native bindings).

### Airtable
- **Pagination requires a `do/while` offset loop.** The API silently caps at 100 records. Pattern lives in `app/lib/airtable.ts`; copy it for every new table fetch.
- **Airtable calls are server-side only.** Never import `app/lib/airtable.ts` (or any helper reading `AIRTABLE_API_KEY`) from a `"use client"` component. Pass data as props.
- **Airtable silently drops writes to non-existent columns.** A 200 OK does not prove the field name is right. Always round-trip (save → reload → verify the field came back) when adding a new column.
- **Visibility flag column is `publish`** (boolean) on `News`, `Team`, `BCFNumbers`. Public reads should fall back: `Boolean(fields.public ?? fields.publish)` — `public` was the original name; `publish` is the canonical one and what saves write.

### Routing / layout
- **No nested `<main>`.** `app/layout.tsx` already wraps in `<main>`. Inner pages: `<div>` / `<section>` / `<article>`.
- **Dynamic route params are async** (Next 16): `params: Promise<{ slug: string }>` → `await params`. Sync access warns and will break.
- **Every `[slug]` route exports both `generateStaticParams` and `generateMetadata`.** Both, always.
- **Do not re-create `RouteWarmup`.** Deleted as dead code; ISR handles warming.

### Forms / state — two distinct patterns
- **Public forms** (contact, etc.) use **Server Actions + React 19 `useActionState`** (`actions.ts` + `Form.tsx`). No manual `fetch` + `useState`.
- **Admin (Clerk-gated) editors** use **client `useState` + `adminPatch`/`adminPost`/`adminDelete`** from `app/admin/lib/api.ts`, then call `adminRevalidate("<tag>")` and `router.refresh()`. Tags: `news`, `team`, `bcf-numbers`, `site-config`, `directors`, `films`, `social`, `festival-photos`. Do **not** introduce Server Actions for admin — the existing pattern is uniform across all admin pages.
- **Filters/forms must be fully controlled.** Parent owns state, no internal mirror state (drift bug fixed 2026-04-07).
- **DnD-using admin clients (`team`, `social`, `about`) need a `mounted` guard.** `@dnd-kit` doesn't render identical markup on SSR vs first client render → hydration mismatch. Pattern: `useState(false) + useEffect(() => setMounted(true), [])` and gate the DnD subtree on `mounted`. Don't forget `useEffect` in the React import (we hit this during ENOSPC recovery — silent until runtime).

### Tailwind v4 syntax
Silent no-ops if you use v3 syntax:
- `bg-linear-to-b` — NOT `bg-gradient-to-b`
- `aspect-2/3` — NOT `aspect-[2/3]`

### Components / architecture
- **Default to Server Components.** `"use client"` only for `useState`, browser APIs, or event handlers.
- **Shared helpers live in `app/lib/utils.ts`** (`slugify`, `firstString`, `getValidImageUrl`). Don't re-inline.

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
Admin mutations — `app/api/admin/records/[table]` (PATCH/POST/DELETE + `revalidateTag`). Allowlist lives in that route.

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

> Route rename: `/completed-films` → `/films` (commit `9e9f523`). All internal links and `generateStaticParams` updated; old URLs are gone.

---

## 5. Git workflow

`feature/*` → PR → test/vercel-ci → `develop` (Coolify staging) → `main` (Coolify prod).
**Never push directly to `main` or `develop`.** See `GIT_WORKFLOW.md`.

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

## 7. Active sprint — `feat/film-videos-press` (updated 2026-05-01)

### `/films` bugs (carry-over)

| # | Status | Description |
|---|---|---|
| 1 | 🟠 Likely fixed, unverified | Mobile "Load more" → in-app error. Touched by `e1760d1` + `9e9f523`. Needs real-device repro on Vercel preview. |
| 2 | 🟢 Closed | Gallery expiry. Fixed by `/api/img` proxy (`5488d45`, `9cabe78`). |
| 3 | 🟢 Closed | "Load more" latency. Fixed by `9e9f523`, `e1760d1`. |

### In-flight (uncommitted)

**Task 1 — Hero in admin/home** ✅ implemented, awaiting browser verification.
- New admin section above About on `/admin/home`. 9 fields (`title`, `subtitle`, `description`, `video_url`, `poster_url`, `cta1_text/link`, `cta2_text/link`) stored as `section = "hero"` row in `SiteConfig`.
- Files: `app/lib/hero.ts`, `app/components/HomeHero.tsx`, `app/admin/(protected)/home/page.tsx` + `HomeClient.tsx`.

**Task 2 — `publish` checkbox on News / Team / BCFNumbers** ✅ done, awaiting browser E2E verification.
- ✅ Admin clients (`NewsClient`, `TeamClient`, `home/HomeClient` BCFNumbers section) all surface a `public` boolean checkbox.
- ✅ Airtable column added as `publish`.
- ✅ Save payload key is `publish:` in News (`NewsClient.tsx:239`, `:302`), Team (`TeamClient.tsx:276`, `:313`), Home BCFNumbers (`HomeClient.tsx:164`). Local `NewsRow`/`TeamRow`/`BCFNumberRow` types intentionally retain `public: boolean` as the in-memory field name — the local→Airtable mapping happens at save.
- ✅ Public reads use the `public === true || publish === true` dual-field fallback in all five lib functions: `app/lib/news.ts:91`, `app/lib/about.ts:133` (readTeam), `app/lib/about.ts:185` (readFestivalPhotos), `app/lib/home.ts:138` (readBCFNumbers), `app/lib/home.ts:193` (readHomeNews).

**Task 3 — FilmCard subtitle** ✅ done. Original title in red (`text-red-600 text-[10px] uppercase`) shown when it differs from the EN title; country shown after the director with a `border-l` divider. See `app/components/FilmCard.tsx:39-47`.

**Task 4 — Films UI cleanup** ✅ done.
- Renamed exports to drop the `Fixed` suffix in `app/components/{SmartImage,FilmCard,FilmGrid,FilmGridClient}.tsx`. Filenames were already clean; consumers used clean local bindings, so the rename was internal-only.
- Deleted `app/films-optimized/` (dead "Fixed comparison" route — bypassed the `/api/img` proxy and linked to the retired `/completed-films/` path; zero inbound imports).

### ENOSPC recovery (2026-05-01)
A disk-full event mid-write truncated `news/page.tsx` and `home/page.tsx` to 0 bytes and dropped `useEffect` from three client imports. Recovered by:
1. Rebuilding both `page.tsx` files with the additive Task 1 + Task 2 fields the live clients now expect (NOT a clean `git checkout HEAD --` — clients had moved on).
2. Adding `useEffect` to `team/`, `social/`, `about/` `*Client.tsx` imports.
3. Fixing `NewsClientLoader` dynamic-import — `NewsClient` is a default export, so `() => import("./NewsClient")` (not `.then(mod => mod.NewsClient)`).

`tsc` clean as of recovery. Lesson: ENOSPC produces *partial* writes, not "no change" — re-read every touched file before declaring success.

### Other touch-ups (uncommitted)
- `app/api/img/film/[slug]/[type]/route.ts` — `sharp` resize (≤2000 px / q82 mozjpeg) for >3.5 MB or >2000 px upstreams. Adds `sharp@^0.34.5`.
- `AboutCountersClient.tsx` — counter spacing tightened (`gap-x-2`).
- `HomeDirectorsPreview.tsx` — "View all directors" promoted to primary CTA.

---

## 8. Coding discipline

### Think before coding
- State assumptions explicitly. If uncertain, ask — don't guess silently.
- If multiple interpretations exist, surface them before picking one.
- If a simpler approach exists, say so. Push back when warranted.

### Simplicity first
- Minimum code that solves the problem. Nothing speculative.
- No features, abstractions, or "configurability" beyond what was asked.
- No error handling for impossible scenarios.
- 200 lines that could be 50? Rewrite it.

### Surgical changes
- Touch only what the task requires. Don't "improve" adjacent code.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that *your* changes made unused. Leave pre-existing dead code alone.

### Goal-driven execution
Transform tasks into verifiable goals before starting:

```
[Step] → verify: [check]
[Step] → verify: [check]
```

- "Fix the bug" → write a test that reproduces it, then make it pass.
- "Add validation" → write tests for invalid inputs, then make them pass.
- "Refactor X" → ensure tests pass before and after.

Weak criteria ("make it work") require constant clarification. Strong criteria let you loop independently.
