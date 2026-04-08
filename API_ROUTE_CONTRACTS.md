# API Route Contracts & Usage Guide

This document defines the exact request/response format for all Sprint 1 routes.

---

## Common Response Format

All routes return JSON with this structure:

### Success (200 OK)
```json
{
  "ok": true,
  "data": { /* route-specific data */ }
}
```

### Error (500 Internal Server Error)
```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

---

## Routes

### GET `/api/hero-video`

**Purpose**: Home hero video, poster, title, subtitle

**Query Parameters**: None

**Response**:
```json
{
  "ok": true,
  "data": {
    "videoUrl": "https://cdn.../video.mp4",
    "posterUrl": "https://cdn.../poster.png",
    "title": "Bord Cadre Films",
    "subtitle": "Société de production...",
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 1 hour (3600s)

**Usage**:
```typescript
const res = await fetch('/api/hero-video');
const { data } = await res.json();
return (
  <video src={data.videoUrl} poster={data.posterUrl} />
);
```

---

### GET `/api/home-about`

**Purpose**: About section intro text on home page

**Query Parameters**: None

**Response**:
```json
{
  "ok": true,
  "data": {
    "title": "Bord Cadre Films",
    "subtitle": "Depuis 2008",
    "description": "Société de production...",
    "cta_text": "En savoir plus",
    "cta_link": "/about",
    "background_image": "https://cdn.../bg.jpg",
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 1 hour (3600s)

**Usage**:
```typescript
const res = await fetch('/api/home-about');
const { data } = await res.json();
return (
  <section>
    <h2>{data.title}</h2>
    <p>{data.description}</p>
    <a href={data.cta_link}>{data.cta_text}</a>
  </section>
);
```

---

### GET `/api/bcf-numbers`

**Purpose**: Studio statistics counters

**Query Parameters**: None

**Response**:
```json
{
  "ok": true,
  "data": {
    "numbers": [
      {
        "number": 15,
        "label": "films produits",
        "description": "Films complétés",
        "order": 1
      },
      {
        "number": 8,
        "label": "réalisateurs",
        "description": "Partenaires réguliers",
        "order": 2
      }
    ],
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 1 hour (3600s)

**Usage**:
```typescript
const res = await fetch('/api/bcf-numbers');
const { data } = await res.json();
return (
  <div>
    {data.numbers.map(n => (
      <counter key={n.order} value={n.number} label={n.label} />
    ))}
  </div>
);
```

---

### GET `/api/home-news`

**Purpose**: Recent news items carousel on home

**Query Parameters**:
- *(none: hardcoded limit=3)*

**Response**:
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "rec123xyz",
        "slug": "sun-over-rimini",
        "title": "Sun Over Rimini",
        "excerpt": "Post-production has started...",
        "image": "https://cdn.../news.jpg",
        "status": "In post-production",
        "publishedAt": "2026-02-21",
        "order": 1
      }
    ],
    "total": 1,
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 30 minutes (1800s) *refresh more frequently*

**Usage**:
```typescript
const res = await fetch('/api/home-news');
const { data } = await res.json();
return (
  <Carousel>
    {data.items.map(item => (
      <NewsCard key={item.id} {...item} />
    ))}
  </Carousel>
);
```

---

### GET `/api/about-bio`

**Purpose**: Founder bio section on About page

**Query Parameters**: None

**Response**:
```json
{
  "ok": true,
  "data": {
    "name": "Founder Name",
    "title": "Founder & Director",
    "bio": "Founder biography text...",
    "image": "https://cdn.../bio.jpg",
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 24 hours (86400s) *rarely changes*

**Usage**:
```typescript
const res = await fetch('/api/about-bio');
const { data } = await res.json();
return (
  <section>
    {data.image && <img src={data.image} alt={data.name} />}
    <h3>{data.name}</h3>
    <p>{data.bio}</p>
  </section>
);
```

---

### GET `/api/team`

**Purpose**: Team members carousel on About page

**Query Parameters**: None

**Response**:
```json
{
  "ok": true,
  "data": {
    "members": [
      {
        "id": "rec456abc",
        "name": "Jane Doe",
        "role": "Producer",
        "bio": "Bio text...",
        "image": "https://cdn.../team1.jpg",
        "order": 1
      }
    ],
    "total": 1,
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 1 hour (3600s)

**Usage**:
```typescript
const res = await fetch('/api/team');
const { data } = await res.json();
return (
  <Carousel>
    {data.members.map(m => (
      <TeamCard key={m.id} {...m} />
    ))}
  </Carousel>
);
```

---

### GET `/api/festival-photos`

**Purpose**: Festival gallery on About page

**Query Parameters**: None

**Response**:
```json
{
  "ok": true,
  "data": {
    "photos": [
      {
        "id": "rec789def",
        "title": "Cannes 2025",
        "description": "Our film at Cannes...",
        "image": "https://cdn.../gallery1.jpg",
        "festival": "Cannes",
        "year": "2025",
        "order": 1
      }
    ],
    "total": 1,
    "source": "airtable" | "fallback"
  }
}
```

**Cache**: 1 hour (3600s)

**Usage**:
```typescript
const res = await fetch('/api/festival-photos');
const { data } = await res.json();
return (
  <Gallery>
    {data.photos.map(p => (
      <GalleryImage key={p.id} src={p.image} alt={p.title} />
    ))}
  </Gallery>
);
```

---

## Testing Routes Manually

### Using curl

```bash
# Test home about
curl http://localhost:3000/api/home-about

# Test numbers
curl http://localhost:3000/api/bcf-numbers

# Test news
curl http://localhost:3000/api/home-news

# Check response structure
curl http://localhost:3000/api/team | jq '.data.members[0]'
```

### Using fetch in browser console

```javascript
// Test hero video
const hero = await fetch('/api/hero-video').then(r => r.json());
console.log(hero.data.videoUrl);

// Test fallback behavior
const news = await fetch('/api/home-news').then(r => r.json());
console.log(news.data.source); // "airtable" or "fallback"
```

---

## Integration Patterns

### Server Component (Recommended)

```typescript
// app/components/HomeAboutSection.tsx
import { readHomeAbout } from '@/app/lib/home';

export default async function HomeAboutSectionagas() {
  const { data } = await readHomeAbout();
  
  return (
    <section>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
    </section>
  );
}
```

### Client Component with Suspense

```typescript
// app/page.tsx
import HomeAboutSection from './components/HomeAboutSection';
import { Suspense } from 'react';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeAboutSection />
    </Suspense>
  );
}
```

### Direct API Call (Client)

```typescript
'use client';
import { useEffect, useState } from 'react';

export function NewsCarousel() {
  const [news, setNews] = useState(null);
  
  useEffect(() => {
    fetch('/api/home-news')
      .then(r => r.json())
      .then(d => setNews(d.data));
  }, []);
  
  return news ? <Carousel items={news.items} /> : null;
}
```

---

## Error Handling

All routes gracefully degrade:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "source": "fallback"
  }
}
```

**Never returns 5xx error** — falls back to default/empty data instead.

Client can detect:
```typescript
if (data.source === 'fallback') {
  console.warn('Using fallback data - Airtable may be unavailable');
}
```

---

## Airtable Table Schema Reference

| Route | Airtable Table | Required Fields |
|-------|---|---|
| hero-video | HeroVideo | videoUrl (videoFile), posterUrl (poster), title |
| home-about | HomeAbout | description, title |
| bcf-numbers | BCFNumbers | number, label, order |
| home-news | News | title, slug, publishedAt (or order) |
| about-bio | Founder | name, title, bio |
| team | Team | name, role, order |
| festival-photos | FestivalPhotos | title, image, order |

*Fields in parentheses are alternate field names supported by the implementation.*

---

## Performance Notes

- **Request Deduplication**: Multiple components can safely call helpers in same render (React cache() prevents duplicate fetches)
- **ISR**: Routes gebeerate static responses then revalidate in background
- **No N+1**: Single fetch per route, not per item
- **Fallback Speed**: < 50ms even if Airtable is down

---

## Future Enhancements

1. **On-demand Revalidation**: `/api/revalidate?tag=home-about` (requires auth)
2. **Pagination**: `?limit=10&offset=0` for news/team/photos
3. **Filtering**: `?festival=Cannes&year=2025` for festival-photos
4. **Preview Mode**: `?draft=true` for editorial preview
5. **GraphQL**: Alternative `/api/graphql` endpoint

---

Version: 1.0  
Last Updated: 2026-04-07  
Project: Bord Cadre Films (Next.js 16)
