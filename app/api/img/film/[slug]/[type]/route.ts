import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import sharp from 'sharp';
import { readAirtableFilms } from '@/app/lib/airtable';

// Resolves /api/img/film/<slug>/<type>[?w=<width>] to the Airtable image,
// downscaled to the requested width (or the source max if no `w`).
//
// `type` is one of:  poster | profile | festival | image-N (N = 0-indexed)
// `w` (optional)  :  target output width in pixels. Snapped to the nearest
//                    allowed bucket so the cache key has finite cardinality.
//
// Why the proxy: Airtable signed URLs rotate every ~15 min and expire ~2h.
// A stable same-origin URL means HTML never holds a dying URL, the optimizer
// can cache the optimized blob by stable key, and idle tabs recover by simply
// re-fetching on the next request.
//
// Path-based `type` (instead of querystring) so the URL works under Next.js
// 16's images.localPatterns without listing every possible value. Width is
// querystring because the bucket count is small and finite.

// Sharp uses native bindings — must run on the Node runtime, not Edge.
export const runtime = 'nodejs';

// Vercel's image optimizer refuses to re-encode upstream responses larger than
// 4 MB and just streams them through, which means the browser ends up decoding
// the original (multi-megapixel) JPEG into a tiny grid slot. Resizing here
// keeps every upstream comfortably below the 4 MB cap.
const RESIZE_MAX_WIDTH = 2000;
const RESIZE_QUALITY = 82;
const PASSTHROUGH_MAX_BYTES = 3_500_000;

// Allowed `?w=` buckets. Mirrors the values in next.config.ts `imageSizes` so
// requests proxied via /_next/image map cleanly to the same cache keys we'd
// Snapping to a bucket bounds cache cardinality;
// otherwise an attacker (or a stray ?w=anything in HTML) could fill the data
// cache with thousands of near-duplicate variants.
const WIDTH_BUCKETS = [80, 144, 256, 320, 384, 640, 1024, 2000] as const;

/**
 * IMPORTANT:
 * This endpoint is the real bottleneck (Airtable + sharp).
 * Do NOT rely on Next/Image warmup — warm THIS endpoint directly to populate
 * the unstable_cache and prevent cold-start latency for users.
 */
function snapWidth(raw: string | null): number {

  if (!raw) return RESIZE_MAX_WIDTH;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return RESIZE_MAX_WIDTH;
  // Pick the smallest bucket that's ≥ requested width; cap at MAX.
  for (const b of WIDTH_BUCKETS) if (b >= n) return b;
  return RESIZE_MAX_WIDTH;
}

// Cache the resolved + resized binary across requests and dev restarts.
// Without this, every cache-cold image request re-downloads multi-MB from
// Airtable AND re-runs sharp encode — the dominant slowness on first paint.
// Returns base64 because unstable_cache JSON-serializes its values; raw
// Buffers don't survive the round-trip. ~33% size inflation is acceptable
// vs. the cost of re-fetching and re-encoding.
//
// Tagged 'films' so editor saves (which already revalidate that tag) also
// flush stale image bytes — no need to wait for the 1h TTL.
//
// `width` is a key part — each bucket has its own entry.
const _resolveAndResizeImage = unstable_cache(
  async (slug: string, type: string, width: number): Promise<{ data: string; contentType: string } | null> => {
    const films = await readAirtableFilms();
    const film = films.find((f) => f.slug === slug);
    if (!film) return null;

    let url: string | undefined;
    if (type === 'poster') url = film.poster;
    else if (type === 'profile') url = film.profilePicture;
    else if (type === 'festival') url = film.festivalLogoUrl;
    else if (type.startsWith('image-')) {
      const idx = Number.parseInt(type.slice('image-'.length), 10);
      if (Number.isInteger(idx) && idx >= 0 && idx < (film.images?.length ?? 0)) {
        url = film.images?.[idx];
      }
    }
    if (!url) return null;

    const upstream = await fetch(url);
    // Throw — not return null — so unstable_cache does NOT memoize this
    // failure. Airtable signed URLs can transiently 403 under burst load or
    // mid-rotation; caching null for 1h would freeze a 404 onto a perfectly
    // valid record. Returned `null` is reserved for genuine data-shape misses
    // (no film, no field) which are safe to negative-cache.
    if (!upstream.ok) {
      throw new Error(`upstream ${upstream.status} for ${slug}/${type}`);
    }

    const upstreamBuf = Buffer.from(await upstream.arrayBuffer());
    const upstreamCT = upstream.headers.get('content-type') ?? 'image/jpeg';

    let outBuf: Buffer = upstreamBuf;
    let outCT = upstreamCT;

    // Always re-encode when a specific width was requested — even if the
    // source is small, the caller wants a known size.
    const meta = await sharp(upstreamBuf).metadata();
    const sourceWider = (meta.width ?? 0) > width;
    const oversized = upstreamBuf.byteLength > PASSTHROUGH_MAX_BYTES;

    if (sourceWider || oversized) {
      outBuf = await sharp(upstreamBuf)
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: RESIZE_QUALITY, mozjpeg: true })
        .toBuffer();
      outCT = 'image/jpeg';
    }

    return { data: outBuf.toString('base64'), contentType: outCT };
  },
  ['film-img-v2'],
  { revalidate: 3600, tags: ['films'] },
);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string; type: string }> },
) {
  const { slug, type } = await ctx.params;
  const width = snapWidth(new URL(req.url).searchParams.get('w'));

  let result: Awaited<ReturnType<typeof _resolveAndResizeImage>>;
  try {
    result = await _resolveAndResizeImage(slug, type, width);
  } catch {
    // Transient upstream failure (Airtable 403/429/etc). NOT cached upstream
    // because _resolveAndResizeImage threw. Tell every layer not to cache
    // either — next request will retry and likely succeed.
    return new NextResponse(null, {
      status: 502,
      headers: { 'cache-control': 'no-store' },
    });
  }

  if (!result) {
    // Genuine miss — film/slug/field doesn't exist. Negative-cache for 5 min
    // so SmartImage retries and downstream caches don't hammer the function.
    return new NextResponse(null, {
      status: 404,
      headers: { 'cache-control': 'public, max-age=300, s-maxage=300' },
    });
  }

  const buf = Buffer.from(result.data, 'base64');
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'content-type': result.contentType,
      // 1h matches the unstable_cache TTL so browser/CDN re-validate alongside
      // the server-side cache rotation. immutable would be wrong — editor saves
      // can flush via the 'films' tag at any time.
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      // Different widths must not collide in any shared cache.
      'vary': 'Accept',
    },
  });
}
