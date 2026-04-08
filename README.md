# Bord Cadre Films — Website

Film catalogue website for [Bord Cadre Films](https://bordcadrefilms.com), a Geneva-based film production company. Built with Next.js App Router, Airtable as a data source, and deployed on Vercel.

## Overview

This project replaces the previous Dorik + client-side Airtable setup, which suffered from slow load times and display bugs due to direct API calls from the browser. The new architecture uses server-side Static Site Generation (SSG) with Incremental Static Regeneration (ISR), delivering pre-rendered HTML to visitors instantly.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Data | Airtable (server-side only) |
| Rendering | SSG + ISR |
| Hosting | Vercel |

## Features

- Film catalogue with filtering by year, genre, and country
- Individual film detail pages (SSG, pre-generated at build time)
- Directors listing
- News / press section
- About page with team and founder bio
- Contact page
- Responsive design, optimized images via `next/image`
- SEO-ready with static HTML output

## Project Structure

```
app/
├── page.tsx                        # Home
├── layout.tsx                      # Root layout
├── globals.css
├── completed-films/
│   ├── page.tsx                    # Film grid (SSG + ISR)
│   └── [slug]/page.tsx             # Film detail (SSG)
├── directors/page.tsx
├── news/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── about/page.tsx
├── contact/page.tsx
├── components/                     # Shared UI components
│   ├── FilmCard.tsx
│   ├── FilmGrid.tsx
│   ├── FilmFilters.tsx
│   ├── DirectorCard.tsx
│   ├── NewsCarousel.tsx
│   ├── Footer.tsx
│   └── ...
└── lib/
    ├── airtable.ts                 # Airtable fetch functions (server-only)
    ├── catalog.ts                  # Film data helpers
    └── news.ts                     # News data helpers
public/                             # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- An Airtable account with access to the Bord Cadre Films base

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
AIRTABLE_API_KEY=your_personal_access_token
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=Films
AIRTABLE_VIEW_NAME=Movie BCf website
```

> Airtable credentials are **server-side only** — never exposed in the client bundle.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
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

Pages revalidate automatically via ISR — no manual redeploy needed when Airtable content changes.

## Airtable Schema

The `Films` table (view: `Movie BCf website`) expects the following fields:

| Field | Type |
|---|---|
| Titre | Text |
| Slug | Text (unique, stable) |
| Affiche | Attachment |
| Réalisateur | Text / Linked record |
| Année | Number |
| Durée | Number (minutes) |
| Pays | Text / Multi-select |
| Genre | Text / Multi-select |
| Synopsis | Long text |
| Bande_annonce_URL | URL |
| Statut | Select |

## Deployment

Deployed automatically via Vercel on push to `main`. Set the environment variables in the Vercel project settings (never commit `.env.local`).

## Contact

[info@bordcadrefilms.com](mailto:info@bordcadrefilms.com)
