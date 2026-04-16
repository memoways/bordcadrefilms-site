# Bord Cadre Films — Website

Film catalogue website for Bord Cadre Films, a Geneva-based film production company. Built with Next.js App Router, Airtable as the server-side data source, Clerk for admin authentication, and deployed on Vercel.

## Overview

Replaces the previous Dorik + client-side Airtable setup, which had slow load times and display bugs caused by direct Airtable calls from the browser. The new architecture uses server-side SSG with ISR, delivering pre-rendered HTML instantly while keeping Airtable credentials server-side only.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Data | Airtable (server-side only) |
| Auth | Clerk (admin only) |
| Rendering | SSG + ISR |
| Hosting | Vercel |

## Features

- Film catalogue with filtering by year, genre, and country
- Individual film detail pages (SSG, pre-generated at build time)
- Directors listing and detail pages with gallery and filmography
- News / press section
- About page with team, founder bio, and festival gallery
- Contact page
- Admin CMS at `/admin` (Clerk-protected): home, about, team management with on-demand ISR revalidation
- Responsive design, optimised images via `next/image`

## Project Structure

```
app/
├── page.tsx                        # Home
├── layout.tsx                      # Root layout
├── globals.css
├── completed-films/
│   ├── page.tsx                    # Film grid (SSG + ISR)
│   ├── loading.tsx
│   └── [slug]/page.tsx             # Film detail (SSG)
├── directors/
│   ├── page.tsx
│   ├── loading.tsx
│   └── [slug]/page.tsx
├── news/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── about/page.tsx
├── contact/page.tsx
├── admin/                          # Clerk-protected CMS
│   ├── (protected)/
│   │   ├── page.tsx               # Dashboard
│   │   ├── layout.tsx
│   │   ├── home/                  # Edit hero, about bloc, BCF numbers
│   │   ├── about/                 # Edit founder bio, festival gallery
│   │   └── team/                  # Add/reorder/edit team members
│   ├── components/                 # AdminSidebar, AdminField, AdminToast
│   ├── lib/api.ts                  # Client-side admin mutation helpers
│   └── sign-in/
├── api/
│   ├── admin/
│   │   ├── revalidate/            # On-demand ISR flush (POST, auth-gated)
│   │   └── records/[table]/       # Airtable CRUD proxy (auth-gated)
│   ├── hero-video/
│   ├── home-about/
│   ├── bcf-numbers/
│   ├── home-news/
│   ├── about-bio/
│   ├── team/
│   └── festival-photos/
├── components/                     # Shared UI components
└── lib/
    ├── airtable.ts                 # Films & directors fetch (server-only)
    ├── catalog.ts                  # Film & director data helpers
    ├── home.ts                     # Home section helpers (about, news, numbers)
    ├── about.ts                    # About page helpers (bio, team, gallery)
    ├── hero.ts                     # Hero video helper
    ├── news.ts                     # News helpers
    ├── mock-data.ts                # Fallback data (used until Airtable tables are live)
    └── utils.ts                    # Shared utilities (slugify, firstString, etc.)
public/
└── fonts/                          # Self-hosted web fonts (Open Sans, Aleo)
```

## Getting Started

### Prerequisites

- Node.js 22

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Airtable — Films & Directors (existing base)
AIRTABLE_API_KEY=your_personal_access_token
AIRTABLE_BASE_ID=your_films_base_id
AIRTABLE_TABLE_NAME=Films
AIRTABLE_VIEW_NAME=Movie BCf website

# Airtable — CMS base (editorial content)
# Can be the same base or a separate one
AIRTABLE_CMS_BASE_ID=your_cms_base_id

# Clerk — admin authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

> Airtable credentials are **server-side only** — never exposed to the client bundle.

### Development

```bash
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

### Build

```bash
npm run build && npm start
```

## Data Architecture

```
Build time / ISR trigger
  → Next.js Server fetches Airtable
  → TypeScript data transformation
  → Static HTML generation
  → Cached on Vercel CDN
  → Instant delivery to visitor
  → Background revalidation (ISR)
```

ISR `revalidate` per surface:

| Surface | TTL | Cache tag |
|---|---|---|
| Hero video | 3600s | `hero-video` |
| Home about / BCF numbers | 3600s | `site-config`, `bcf-numbers` |
| Home news | 1800s | `home-news` |
| Films & directors | 900s | `films`, `directors` |
| About / team / gallery | 3600s | `site-config`, `team`, `festival-photos` |
| Admin pages | 0 (always fresh) | — |

On-demand revalidation via `POST /api/admin/revalidate` (Clerk-authenticated, flushes by tag).

## Admin CMS

The `/admin` section is Clerk-authenticated. It allows the editorial team to:

- Edit the home hero video, about editorial bloc, and BCF stat counters
- Manage team members (add, reorder, edit, publish/unpublish)
- Edit the founder bio and festival gallery photos
- Flush ISR cache on demand by tag

Films and news are managed directly in Airtable — there is no admin UI for them.

Editorial data lives in a separate Airtable CMS base (`AIRTABLE_CMS_BASE_ID`). See `AIRTABLE_SCHEMA.md` for the required table schema and `AIRTABLE_TABLES_SETUP.md` for the step-by-step creation guide.

## Deployment

Deployed automatically via Vercel on push to `main`. Set all environment variables in the Vercel project settings — never commit `.env.local`.

See `GIT_WORKFLOW.md` for branching conventions and CI/CD details.
