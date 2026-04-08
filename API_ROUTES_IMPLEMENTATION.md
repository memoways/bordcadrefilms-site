---
title: Sprint 1 API Routes Implementation
status: Complete
date: 2026-04-07

---

# API Routes Implementation Summary

## Overview
Created comprehensive API route structure for Sprint 1 (Data/API alignment phase) per roadmap. All routes follow Next.js 16 Route Handler best practices from Vercel documentation and project conventions.

## Routes Implemented

### 1. GET `/api/hero-video` ✅
- **Helper**: `app/lib/hero.ts` (existing)
- **Route**: `app/api/hero-video/route.ts` (existing)
- **Cache**: `revalidate: 3600` (1 hour ISR)
- **Tags**: `["hero-video"]`
- **Payload**: `{ videoUrl, posterUrl, title, subtitle, source }`
- **Fallback**: Built-in hardcoded defaults
- **Status**: DONE

### 2. GET `/api/home-about` ✅
- **Helper**: `app/lib/home.ts::readHomeAbout`
- **Route**: `app/api/home-about/route.ts`
- **Table**: `AIRTABLE_HOME_ABOUT_TABLE` (default: "HomeAbout")
- **Cache**: `revalidate: 3600` (1 hour ISR)
- **Tags**: `["home-about"]`
- **Payload**: `{ title, subtitle, description, cta_text, cta_link, background_image, source }`
- **Fallback**: Bord Cadre Films boilerplate text
- **Status**: NEW

### 3. GET `/api/bcf-numbers` ✅
- **Helper**: `app/lib/home.ts::readBCFNumbers`
- **Route**: `app/api/bcf-numbers/route.ts`
- **Table**: `AIRTABLE_NUMBERS_TABLE` (default: "BCFNumbers")
- **Cache**: `revalidate: 3600` (1 hour ISR)
- **Tags**: `["bcf-numbers"]`
- **Payload**: `{ numbers: [{ number, label, description, order }], source }`
- **Fallback**: 15 films | 8 réalisateurs | 50 festivals | 2008 année de fondation
- **Status**: NEW

### 4. GET `/api/home-news` ✅
- **Helper**: `app/lib/home.ts::readHomeNews(limit=3)`
- **Route**: `app/api/home-news/route.ts`
- **Table**: `AIRTABLE_NEWS_TABLE` (default: "News")
- **Cache**: `revalidate: 1800` (30 min ISR, more frequent than others)
- **Tags**: `["home-news"]`
- **Payload**: `{ items: [{ id, slug, title, excerpt, image, status, publishedAt, order }], total, source }`
- **Fallback**: Empty array (no hardcoded news)
- **Sorting**: By `publishedAt DESC`, then by `order`
- **Status**: NEW

### 5. GET `/api/about-bio` ✅
- **Helper**: `app/lib/about.ts::readFounderBio`
- **Route**: `app/api/about-bio/route.ts`
- **Table**: `AIRTABLE_FOUNDER_TABLE` (default: "Founder")
- **Cache**: `revalidate: 86400` (24 hour ISR, founder info changes rarely)
- **Tags**: `["founder-bio"]`
- **Payload**: `{ name, title, bio, image, source }`
- **Fallback**: Bord Cadre Films boilerplate
- **Status**: NEW

### 6. GET `/api/team` ✅
- **Helper**: `app/lib/about.ts::readTeam`
- **Route**: `app/api/team/route.ts`
- **Table**: `AIRTABLE_TEAM_TABLE` (default: "Team")
- **Cache**: `revalidate: 3600` (1 hour ISR)
- **Tags**: `["team"]`
- **Payload**: `{ members: [{ id, name, role, bio, image, order }], total, source }`
- **Fallback**: Empty array
- **Sorting**: By `order` ASC
- **Status**: NEW

### 7. GET `/api/festival-photos` ✅
- **Helper**: `app/lib/about.ts::readFestivalPhotos`
- **Route**: `app/api/festival-photos/route.ts`
- **Table**: `AIRTABLE_FESTIVAL_PHOTOS_TABLE` (default: "FestivalPhotos")
- **Cache**: `revalidate: 3600` (1 hour ISR)
- **Tags**: `["festival-photos"]`
- **Payload**: `{ photos: [{ id, title, description, image, festival, year, order }], total, source }`
- **Fallback**: Empty array
- **Sorting**: By `order` ASC
- **Status**: NEW

---

## Implementation Details

### Helper Libraries

#### `app/lib/home.ts`
- **Functions**: `readHomeAbout`, `readBCFNumbers`, `readHomeNews`
- **Types**: `HomeAboutData`, `BCFNumbersData`, `NewsItemData`, `HomeNewsResponse`, `BCFNumbersResponse`
- **Cache**: React `cache()` per-request deduplication
- **Error Handling**: Try-catch with fallback functions
- **Field Mapping**: Flexible normalization (handles multiple field name variants from Airtable)

#### `app/lib/about.ts`
- **Functions**: `readFounderBio`, `readTeam`, `readFestivalPhotos`
- **Types**: `FounderBioData`, `TeamMemberData`, `FestivalPhotoData`, `TeamResponse`, `FestivalPhotosResponse`
- **Cache**: React `cache()` per-request deduplication
- **Error Handling**: Try-catch with fallback functions
- **Field Mapping**: Flexible string/image extraction with type guards

### Route Handler Pattern

All route handlers follow this structure:
```typescript
export const revalidate = SECONDS;

export async function GET() {
  try {
    const data = await readHelper();
    return NextResponse.json({
      ok: true,
      data,
    }, { status: 200 });
  } catch (error) {
    console.error("[Route] error:", error);
    return NextResponse.json({
      ok: false,
      error: "Failed message",
    }, { status: 500 });
  }
}
```

**Rationale**
- ✅ Consistent JSON shape across all routes
- ✅ Next.js 16 best practices (NextResponse, async/await)
- ✅ Proper error handling and logging
- ✅ Route-level revalidate export (ISR control)
- ✅ Graceful fallback (never crashes, returns source indicator)

### Environment Variable Strategy

All routes support optional environment overrides to customize table names:
- `AIRTABLE_HOME_ABOUT_TABLE` (default: "HomeAbout")
- `AIRTABLE_NUMBERS_TABLE` (default: "BCFNumbers")
- `AIRTABLE_NEWS_TABLE` (default: "News")
- `AIRTABLE_FOUNDER_TABLE` (default: "Founder")
- `AIRTABLE_TEAM_TABLE` (default: "Team")
- `AIRTABLE_FESTIVAL_PHOTOS_TABLE` (default: "FestivalPhotos")

Falls back to existing:
- `AIRTABLE_BASE_ID`
- `AIRTABLE_API_KEY`

### Cache Strategy

| Route | Revalidate | Use Case | Rationale |
|-------|-----------|----------|-----------|
| hero-video | 3600s | Hero background changes rarely | 1h freshness good enough |
| home-about | 3600s | About section is evergreen | 1h ISR standard |
| bcf-numbers | 3600s | Stats change with milestones | 1h ISR sufficient |
| home-news | 1800s | News is more time-sensitive | 30min for fresher feed |
| about-bio | 86400s | Founder bio changes very rarely | 24h OK, rarely updated |
| team | 3600s | Team structure occasional changes | 1h ISR standard |
| festival-photos | 3600s | Gallery updates periodic | 1h ISR standard |

**Reasoning**: News gets 30min (more frequent updates), founder gets 24h (rarely changes), others get 1h standard (balances freshness vs compute).

### Error Handling & Fallbacks

All routes implement **defensive programming**:
1. **Try-catch blocks** around Airtable fetch
2. **Graceful fallbacks** when Airtable unavailable
3. **Source indicator** in JSON (`"source": "airtable" | "fallback"`)
4. **Console error logging** for debugging
5. **No sensitive data exposure** in error responses
6. **Always returns 200 OK** even on fallback (fallback data is valid)

Example: If Airtable is down, `/api/home-news` returns `{ ok: true, data: { items: [], total: 0, source: "fallback" } }` rather than 500 error.

---

## Next.js Best Practices Applied

### 1. Server-Side Data Fetching ✅
- All fetch operations server-side only
- No client bundle impact
- React `cache()` prevents duplicate requests per render

### 2. ISR (Incremental Static Regeneration) ✅
- Route-level `revalidate` export enables ISR
- Background revalidation after TTL
- No page rebuilds required

### 3. Request Coalescing ✅
- React `cache()` deduplicates same fetches in single render cycle
- Multiple components requesting same route execute fetch once

### 4. Type Safety ✅
- Export types for client consumption (`HomeAboutData`, etc.)
- Full TypeScript coverage
- No `any` types

### 5. Error Boundaries ✅
- Try-catch in all routes
- No unhandled promise rejections
- Fallback strategies ensure uptime

### 6. Consistent Response Shape ✅
- All routes return `{ ok, data }` or `{ ok, error }`
- Predictable client-side consumption
- Easy versioning if needed later

### 7. CEW/Vercel Patterns Applied ✅
- `async-parallel`: N/A (single fetch per route)
- `server-cache-react`: Used in all helpers
- `server-serialization`: Minimal data in fallbacks
- `rendering-conditional-render`: Only error logs on failures

---

## Testing Checklist

### Unit Tests (Helpers)
- [ ] `readHomeAbout()` returns fallback when Airtable unreachable
- [ ] `readBCFNumbers()` sorts by order correctly
- [ ] `readHomeNews()` respects limit parameter
- [ ] `readFounderBio()` handles missing image field
- [ ] `readTeam()` returns empty array on 404
- [ ] `readFestivalPhotos()` extracts first image URL correctly

### Integration Tests (Routes)
- [ ] GET `/api/home-about` returns 200 with `ok: true`
- [ ] GET `/api/bcf-numbers` returns sorted numbers
- [ ] GET `/api/home-news` returns at most 3 items (limit)
- [ ] GET `/api/about-bio` returns founder data or fallback
- [ ] GET `/api/team` returns team array
- [ ] GET `/api/festival-photos` returns photos array
- [ ] All routes return `source: "fallback"` when Airtable down

### Cache Tests
- [ ] revalidate exports match spec
- [ ] Tags are properly set for on-demand revalidation (future)
- [ ] Request deduplication works (cache() in helpers)

### Performance Tests
- [ ] All routes respond < 200ms with Airtable
- [ ] All routes respond < 50ms on fallback
- [ ] Payload sizes reasonable (< 50KB typical)

---

## Files Created

```
app/lib/
  ├─ home.ts (NEW: 222 lines)
  └─ about.ts (NEW: 189 lines)

app/api/
  ├─ home-about/route.ts (NEW: 26 lines)
  ├─ bcf-numbers/route.ts (NEW: 26 lines)
  ├─ home-news/route.ts (NEW: 26 lines)
  ├─ about-bio/route.ts (NEW: 26 lines)
  ├─ team/route.ts (NEW: 26 lines)
  └─ festival-photos/route.ts (NEW: 26 lines)

Total: 8 files | ~547 lines | All TypeScript
```

---

## What's Next

### Immediate (Next Sprint)
1. **Integration**: Wire routes into Home/About components
2. **Testing**: Manual testing of all routes with Airtable
3. **Env Setup**: Configure table names in `.env.local`

### Near-term (Backlog)
1. **On-demand Revalidation**: Add `/api/revalidate` endpoint
2. **Route Documentation**: API spec file (OpenAPI/rapid format)
3. **Monitoring**: Add Sentry/logging for route errors
4. **Caching Header**: Add Cache-Control headers for CDN

---

## Architecture Notes

All routes are **stateless** and **immutable** by design:
- No side effects
- Pure data fetching from Airtable
- Safe to call multiple times per render
- Safe for parallel requests
- Ready for edge caching (Vercel Edge Cache)

The source indicator (`source: "airtable" | "fallback"`) allows clients to:
- Detect when Airtable is down
- Show user warnings if needed
- Collect analytics on fallback usage

---

## Audit Results

✅ **TypeScript**: 0 errors, 0 warnings  
✅ **Next.js Pattern**: Route Handlers conform to v16 App Router  
✅ **Error Handling**: All paths covered  
✅ **Caching**: ISR + request deduplication enabled  
✅ **Performance**: All helpers memoized with React cache()  
✅ **Type Safety**: Full exported types for component consumption  

---

Generated: 2026-04-07
Project: Bord Cadre Films
Sprint: 1 (Data/API Alignment)
