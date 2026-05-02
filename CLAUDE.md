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

## 7. Active sprint

Branch + open work tracked here. Keep tight: one section for OPEN bugs, one for OPEN tasks. Move closed/shipped items out — `git log` is canonical for done work.

Don't add per-task implementation detail here. If a decision is non-obvious, write it as a §1 hard rule (lasts forever) or in a code comment near the call site (lives with the code).

### Lessons (general, keep forever)
- **ENOSPC produces *partial* writes, not "no change".** Disk-full mid-write can truncate files to 0 bytes or drop trailing imports. Re-read every touched file before declaring success; don't trust `tsc` alone (silent until runtime in client components).
- **Closed bugs whose fix shaped current architecture belong in §1, not here.** Sprint is a snapshot; §1 is the contract.

### Current branch: `feat/film-videos-press`

| Open item | Status |
|---|---|
| Mobile "Load more" → in-app error on `/films` | 🟠 Likely fixed by recent grid changes, awaits real-device repro on preview |

---

## 8. Coding discipline

Bias toward caution over speed. For trivial tasks, use judgment.

### Think before coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicit. If uncertain, ask — don't guess silently.
- If multiple interpretations exist, surface them before picking one.
- If simpler approach exists, say so. Push back when warranted.
- If something unclear, stop. Name what's confusing. Ask.

### Simplicity first
Minimum code that solves problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" not requested.
- No error handling for impossible scenarios.
- 200 lines that could be 50? Rewrite.
- Self-check: "Would senior engineer call this overcomplicated?" If yes, simplify.

### Surgical changes
Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things not broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete.
- Remove imports/variables/functions that *your* changes made unused. Leave pre-existing dead code alone.
- Test: every changed line traces directly to user's request.

### Goal-driven execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals before starting:

```
[Step] → verify: [check]
[Step] → verify: [check]
```

- "Fix the bug" → write test that reproduces it, then make it pass.
- "Add validation" → write tests for invalid inputs, then make them pass.
- "Refactor X" → ensure tests pass before and after.

Strong criteria let you loop independent. Weak criteria ("make it work") require constant clarification.

### Working signals
These rules pay off when:
- Fewer unnecessary changes in diffs.
- Fewer rewrites from overcomplication.
- Clarifying questions come before implementation, not after mistakes.
