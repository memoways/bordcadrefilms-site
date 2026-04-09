# Bord Cadre Films — Best Practices

Code quality, architecture, and styling rules for this codebase.
Read before writing any component, page, or data helper.

---

## Table of Contents

1. [Design Tokens & Colors](#1-design-tokens--colors)
2. [Typography](#2-typography)
3. [Component Architecture](#3-component-architecture)
4. [Data Fetching Rules](#4-data-fetching-rules)
5. [Tailwind v4 Rules](#5-tailwind-v4-rules)
6. [Next.js App Router Rules](#6-nextjs-app-router-rules)
7. [TypeScript Rules](#7-typescript-rules)
8. [Clean Code Rules](#8-clean-code-rules)
9. [Accessibility](#9-accessibility)
10. [Image Rules](#10-image-rules)

---

## 1. Design Tokens & Colors

### Use CSS variables — never raw hex in components

Brand colors are defined as semantic CSS variables in `app/globals.css` and registered in the Tailwind `@theme` block.

| Token                   | Value     | Tailwind class      | Usage                          |
|-------------------------|-----------|---------------------|--------------------------------|
| `--color-accent`        | `#E0A75D` | `bg-accent`         | Primary CTAs, gold buttons     |
| `--color-accent-text`   | `#1C1C1C` | `text-accent-text`  | Text on gold buttons           |
| `--color-footer`        | `#2B2B2B` | `bg-footer`         | Footer background only         |
| `--color-brand-dark`    | `#1C1C1C` | `bg-brand-dark`     | Dark hero sections             |
| `--background`          | `#ffffff` | `bg-background`     | Page background                |
| `--foreground`          | `#111111` | `text-foreground`   | Default body text              |

```tsx
// WRONG — raw hex inline
<div className="bg-[#E0A75D] text-[#1C1C1C]">

// CORRECT — semantic token
<div className="bg-accent text-accent-text">

// CORRECT — pre-built CSS class for buttons
<button className="brand-btn-primary">
```

### Button classes

Use the pre-built CSS classes for all CTAs — do not re-implement button styles in components:

```tsx
// Primary gold CTA
<Link href="/films" className="px-6 py-2 rounded-lg brand-btn-primary">
  Voir les films
</Link>

// Secondary/ghost (dark bg)
<button className="brand-btn-secondary">Label</button>

// Ghost on dark background (hero, dark sections)
<Link href="/directors" className="px-6 py-2 rounded-lg border border-zinc-400 text-white hover:bg-white/10 transition-all">
  Réalisateurs
</Link>
```

### Off-brand colors

**Never** introduce colors not in the design system (`#B91C1C`, `#C0392B`, random zincs) unless there is an explicit design reason. Dividers and decorative lines use `bg-accent` or `bg-zinc-200`.

---

## 2. Typography

### Only one font family is loaded

`layout.tsx` loads **SuisseIntl** as a local font, exposed via `--font-open-sans` CSS variable.
In Tailwind this maps to `font-sans`.

```tsx
// All text inherits font-sans automatically via body in globals.css.
// No need to add font-sans to every element.

// Headings — use Tailwind font-weight utilities, not inline style or undefined CSS vars
<h1 className="text-4xl font-light">Title</h1>
<h2 className="text-2xl font-semibold">Section</h2>
```

**Never** reference undefined CSS variables for font:
```tsx
// WRONG — these variables don't exist
const font = "var(--unnamed-font-style-normal) normal var(--unnamed-font-weight-bold) 18px/24px var(--unnamed-font-family-suisse-int-l)"
<p style={{ font }}>...</p>

// CORRECT — use Tailwind utilities
<p className="text-base font-bold leading-6">...</p>
```

### Heading hierarchy in sections

| Context                  | Classes                                    |
|--------------------------|--------------------------------------------|
| Page title (hero)        | `text-4xl md:text-6xl font-light`          |
| Section heading          | `text-2xl md:text-3xl font-light tracking-tight` |
| Sub-section label        | `text-xs uppercase tracking-widest font-medium text-zinc-500` |
| Card title               | `text-lg font-medium`                      |
| Body copy                | `text-base font-light leading-relaxed`     |

---

## 3. Component Architecture

### Server Components by default

Every component in `app/` is a Server Component unless it explicitly needs browser APIs or React hooks.

```tsx
// WRONG — "use client" with no hooks or events
"use client"
export default function FilmCard({ film }: { film: Film }) {
  return <article>...</article>  // purely presentational — no need for "use client"
}

// CORRECT — Server Component
export default function FilmCard({ film }: { film: Film }) {
  return <article>...</article>
}
```

### When to add `"use client"`

Only add `"use client"` when the component uses:
- `useState` / `useReducer` / `useEffect`
- `useRef` for DOM manipulation
- Browser-only APIs (`window`, `document`)
- Event handlers that depend on component state (not just passing a prop)
- Third-party client-only libraries

### Push `"use client"` to the leaf

Keep the boundary as deep as possible. A page with one interactive counter does not need to be a Client Component — only the counter does.

```tsx
// WRONG — whole page is client
"use client"
export default function DirectorsPage() {
  const [open, setOpen] = useState(false)
  return (
    <main>
      <DirectorGrid directors={directors} />  {/* Server-renderable */}
      <Modal open={open} />                   {/* Only this needs state */}
    </main>
  )
}

// CORRECT — only the interactive leaf is a Client Component
// DirectorsPage.tsx — Server Component
export default async function DirectorsPage() {
  const directors = await getDirectors()
  return (
    <main>
      <DirectorGrid directors={directors} />
      <MobileMenuToggle />   {/* "use client" lives inside this component */}
    </main>
  )
}
```

### Component size

If a component exceeds ~150 lines it is likely doing too much.
Extract: parsing/transform logic → `app/lib/utils.ts`, display sub-sections → separate components.

---

## 4. Data Fetching Rules

### Never call internal API routes from Server Components

Server Components run on the server — calling `fetch("/api/...")` from one adds an unnecessary network round-trip through localhost and duplicates revalidation logic.

```tsx
// WRONG — Server Component calling internal API
export default async function HomeAboutSection() {
  const res = await fetch("/api/home-about", { next: { revalidate: 3600 } })
  const json = await res.json()
  ...
}

// CORRECT — call the lib helper directly
import { readHomeAbout } from "@/app/lib/home"

export default async function HomeAboutSection() {
  const data = await readHomeAbout()
  ...
}
```

The `app/api/` routes exist for **external** consumers (webhooks, revalidation triggers, CSV exports). Internal Server Components must go through `app/lib/`.

### Parallel fetches with Promise.all

```tsx
// WRONG — sequential waterfall
const hero  = await readHeroVideo()
const films = await getFilms()

// CORRECT — parallel
const [hero, films] = await Promise.all([readHeroVideo(), getFilms()])
```

### React.cache() for deduplication

All Airtable fetch helpers in `app/lib/` are already wrapped with `cache()`. Do not add extra `cache()` wrappers around them in pages.

### ISR revalidation

- Films / directors: `revalidate = 900` (15 min)
- Hero / about: `revalidate = 3600` (1 hour)
- News: `revalidate = 1800` (30 min)

Set it at the **page** level via `export const revalidate = 900`. Do not set conflicting values at the fetch level unless deliberately tightening freshness for a specific resource.

---

## 5. Tailwind v4 Rules

Tailwind v4 is a breaking API change from v3. Wrong class names silently produce no CSS output.

### Gradients

```
✅ bg-linear-to-b      (v4 canonical)
❌ bg-gradient-to-b    (v3, no-op in v4)
```

### Aspect ratios

```
✅ aspect-2/3          (v4 shorthand)
✅ aspect-video        (v4 built-in)
❌ aspect-[2/3]        (arbitrary form — not needed)
```

### Arbitrary values — use sparingly

Arbitrary values (`bg-[#E0A75D]`, `w-[320px]`) exist for one-off overrides. For brand values use the CSS variable tokens instead. For layout values, prefer Tailwind scale (`w-80`, `max-w-xs`) before reaching for arbitrary values.

### Registered theme tokens

Use semantic token classes wherever possible:

| Class              | Value         |
|--------------------|---------------|
| `bg-accent`        | `#E0A75D`     |
| `text-accent-text` | `#1C1C1C`     |
| `bg-footer`        | `#2B2B2B`     |
| `bg-brand-dark`    | `#1C1C1C`     |
| `bg-background`    | `#ffffff`     |
| `text-foreground`  | `#111111`     |

---

## 6. Next.js App Router Rules

### Params are Promises in Next.js 15+

```tsx
// CORRECT — await params before accessing
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  ...
}
```

### Route-level loading.tsx

Use `loading.tsx` at the route segment level for navigation feedback. Use `<Suspense>` for streaming individual async sections within a page.

```
app/
  completed-films/
    loading.tsx          ← shown during full route navigation
    page.tsx
    [slug]/
      loading.tsx
      page.tsx
```

### generateStaticParams for dynamic routes

All `[slug]` routes (films, directors) must implement `generateStaticParams` to ensure static generation at build time:

```tsx
export async function generateStaticParams() {
  const films = await getFilms()
  return films.map(film => ({ slug: film.slug }))
}
```

### prefetch on navigation links

- `prefetch` (default true) on `<Link>` for primary navigation — fine
- Set `prefetch={false}` for links that appear in large lists (carousels, grids with 20+ items)

### No self-referencing internal fetches in Server Components

See [Data Fetching Rules](#4-data-fetching-rules).

---

## 7. TypeScript Rules

### Strict mode — no `any`

`tsconfig.json` has strict mode enabled. Never use `any`. Use `unknown` and narrow it.

```tsx
// WRONG
function parse(value: any): string { ... }

// CORRECT
function parse(value: unknown): string {
  if (typeof value === 'string') return value
  return ''
}
```

### Explicit prop interfaces

```tsx
// WRONG — inline type on a complex prop
function FilmCard({ film }: { film: { title: string; slug: string; poster?: string } }) {}

// CORRECT — use the shared Film type from lib/airtable
import type { Film } from "@/app/lib/airtable"
function FilmCard({ film }: { film: Film }) {}
```

### Import types with `type` keyword

```tsx
import type { Film } from "@/app/lib/airtable"
import type { Director } from "@/app/lib/catalog"
```

---

## 8. Clean Code Rules

### Extract parsing logic to lib/utils.ts

Pure transformation functions (parsing, formatting, slug generation) belong in `app/lib/utils.ts`, not inside components.

```tsx
// WRONG — parsing logic inside a component
export default function FilmDetail({ film }: { film: Film }) {
  function splitList(value?: string): string[] { ... }
  function parseCrew(raw?: string): Record<string, string> { ... }
  ...
}

// CORRECT — import from utils
import { splitList, parseCrew, formatDuration } from "@/app/lib/utils"
```

### No duplicate helpers across lib files

`firstString`, `firstImageUrl` etc. are duplicated in `hero.ts`, `home.ts`, and `airtable.ts`. These should live once in `app/lib/utils.ts` and be imported.

### Dead code in switch statements

```tsx
// WRONG — all cases return identical value
function statusClass(status: string): string {
  switch (status) {
    case "Currently shooting": return "bg-zinc-100 text-zinc-900"
    case "In post-production": return "bg-zinc-100 text-zinc-900"
    default:                   return "bg-zinc-100 text-zinc-900"
  }
}

// CORRECT — single return since all cases are the same, or implement real variants
function statusClass(_status: string): string {
  return "bg-zinc-100 text-zinc-900"
}
```

### Keys in lists — use stable IDs, not indexes

```tsx
// WRONG — index as key is fragile
{items.map((item, i) => <li key={i}>{item.title}</li>)}

// CORRECT — use a stable ID
{items.map(item => <li key={item.slug}>{item.title}</li>)}
```

### section vs article vs div

| Element     | When to use                                                  |
|-------------|--------------------------------------------------------------|
| `<section>` | Thematic grouping with an implicit/explicit heading          |
| `<article>` | Self-contained content (film card, news item, director card) |
| `<div>`     | Non-semantic layout wrapper only                             |

`DirectorGrid` uses `<section>` but it's a layout grid with no heading — use `<div>` or pass it as `<ul>` / `<ol>`.

### Prefer `next/image` `priority` only above-the-fold

```tsx
// WRONG — priority on every card image in a grid
<Image src={url} alt={alt} priority />   // applied to 12 cards in a grid

// CORRECT — priority on the hero/LCP image only
<Image src={posterUrl} alt={alt} priority />     // above fold
<Image src={cardImage} alt={alt} loading="lazy" /> // in-grid
```

---

## 9. Accessibility

- All `<Image>` elements need a descriptive `alt` (not empty, not just the filename)
- Interactive elements (`<button>`, `<Link>`) need `aria-label` when the visible text is ambiguous
- `aria-pressed` on toggle buttons (e.g. mobile menu)
- `aria-live="polite"` on carousel slides (already in NewsCarousel — keep it)
- Never use `tabIndex={0}` on a non-focusable element wrapped in a link — the link itself is focusable
- Use `focus-visible:ring-2` instead of `focus:ring-2` to avoid showing focus rings on mouse click

---

## 10. Image Rules

### next/image is mandatory for all images

Never use `<img>` — always `next/image` for automatic format conversion, resizing, and lazy loading.

### Always provide `sizes`

```tsx
<Image
  src={url}
  alt={alt}
  fill
  sizes="(max-width: 768px) 100vw, 33vw"
/>
```

### External domains

All Airtable CDN domains must be listed in `next.config.ts` under `images.remotePatterns`.

### Inline SVG preferred over icon libraries

Inline `<svg>` for icons keeps bundle size zero and avoids tree-shaking issues. Do not install icon packages for 2–3 icons.

---

## Audit Checklist

Before opening a PR, verify:

- [ ] No `"use client"` on components that have no hooks or browser APIs
- [ ] No Server Component calling `/api/` internally — use `app/lib/` directly
- [ ] No raw hex colors in component JSX — use CSS variable tokens or `brand-btn-*` classes
- [ ] No undefined CSS variables referenced in `style={{}}`
- [ ] No off-brand colors (red accents, random grays not in the design system)
- [ ] `<Image>` has `sizes`, correct `priority` (above-fold only), and a meaningful `alt`
- [ ] TypeScript — no `any`, all props typed with shared types from `app/lib/`
- [ ] Tailwind v4 syntax: `bg-linear-to-*` not `bg-gradient-to-*`, `aspect-2/3` not `aspect-[2/3]`
- [ ] Parallel `Promise.all` for independent server fetches
- [ ] `export const revalidate` set at page level, consistent with data layer
