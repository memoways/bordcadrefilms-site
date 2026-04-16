# Project : Bord Cadre Films - Claude Instructions

This repository is a Next.js 16 App Router site for Bord Cadre Films. Treat this file as the working guide for how to approach edits in this codebase.

## Core Rule

Do not assume generic Next.js behavior. This project already has custom caching, route warmup, and Airtable-backed data flows. Read the local docs first, then make the smallest change that fits the existing architecture. The main point is to make the app the quickest and most performant UX wise for the user.

## Required Reading Before Changing Code

1. Read `AGENTS.md`.
2. Read `README.md` for the public architecture summary.
3. Read `IMPLEMENTATION_LOG.md` and `PERFORMANCE_OPTIMIZATION.md` for the latest session decisions.
4. When touching Next.js behavior, use the current Next.js docs for v16 App Router patterns.
5. When touching React rendering or performance-sensitive UI, apply the Vercel React best practices skill.
6. When building or restyling UI, apply the frontend design skill and keep the result visually intentional.

## Project Snapshot

- Next.js 16.2.1, React 19.2.4, TypeScript, Tailwind CSS v4.
- Airtable is the server-side source of truth for films, directors, home content, news, about, and contact content.
- `app/api/films/route.ts` is still CSV-based legacy logic and does not yet match the Airtable target.
- Main routes currently include Home, Completed Films, Directors, News, About, and Contact.
- Loading states already exist for `app/completed-films`, `app/directors`, and `app/completed-films/[slug]`.

## Session Decisions To Preserve

- Keep Airtable access server-side only.
- Prefer async Server Components for pages that need data.
- Avoid unnecessary Suspense fallbacks when cached data can be resolved before render.
- Keep ISR and cache settings aligned across page, data fetch, and router warmup layers.
- Preserve the white / monochrome visual direction already established in the latest implementation notes.

## Architecture Rules

- Use Server Components by default in `app/`.
- Use Client Components only for interactivity, local state, browser APIs, or input-driven filtering.
- Keep data fetching in `app/lib/` helpers, not inside presentational components.
- Reuse shared fetch helpers and `cache()` where it prevents duplicate work.
- Use `next/link` for navigation and keep prefetch behavior intentional.
- Keep loading, error, and empty states explicit at the route level when they matter.

## Data And Cache Rules

- Treat Airtable as the source of truth for editorial and catalogue data.
- Preserve the existing ISR / revalidation strategy unless there is a clear reason to change it.
- If you change content sources, update both the server fetch layer and the consuming route or component.
- If you change a page’s data contract, update the front consumer, the source helper, and any cache notes together.
- For CMS or editorial work, document source of truth, API route, front consumer, and ISR cache in the PRD or implementation log.

## UI And Design Rules

- Keep the visual direction deliberate, not generic.
- Favor strong typography, clear hierarchy, and consistent spacing.
- Avoid default-looking component layouts unless the existing design system already requires them.
- Preserve the site’s current monochrome direction unless the task explicitly asks for a new aesthetic.
- Use motion and transitions sparingly and only when they improve clarity or perceived responsiveness.

## Next.js Rules Of Thumb

- Read the current Next.js docs before changing routing, caching, loading, or data-fetching behavior.
- Prefer route-level `loading.tsx` for navigation feedback over ad hoc skeletons when appropriate.
- Prefer `revalidate` and `next: { revalidate }` for time-based freshness, and tags only when on-demand invalidation is needed.
- Prefer `force-cache` for static content and `no-store` only when data must be fresh on every request.
- Keep route params and search params handling aligned with current App Router conventions.

## React Performance Rules

- Use `Promise.all` for independent server fetches.
- Avoid duplicated fetches and redundant serialization.
- Do not add memoization by default; use it only when there is a measured or obvious re-render cost.
- Keep client state local and narrow.
- Use `useTransition` or deferred rendering only when the interaction justifies it.

## Validation Checklist

- Check for TypeScript errors after edits.
- TypeScript strict mode, no `any` types
- Check for lint errors after edits.
- Verify that loading and empty states still work on the touched route.
- If a data change affects the public site, confirm that the cache or revalidation path still matches the data source.

## When In Doubt

- Inspect the actual route, helper, or component before editing.
- Prefer the smallest focused fix over a broad refactor.
- If the request touches multiple surfaces, update the source, consumer, and docs together.
mcp__serena__activate_project project="."
@AGENTS.md

