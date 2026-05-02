import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import sharp from 'sharp';
import { readAirtableFilms } from '@/app/lib/airtable';

// Resolves /api/img/film/<slug>/<type> to the Airtable image, downscaled when
// the source is large enough to defeat downstream optimization or blow the
// bitmap cache.
//
// `type` is one of:  poster | profile | festival | image-N (N = 0-indexed)
//
// Why the proxy: Airtable signed URLs rotate every ~15 min and expire ~2h.
// A stable same-origin URL means HTML never holds a dying URL, the optimizer
// can cache the optimized blob by stable key, and idle tabs recover by simply
// re-fetching on the next request.
//
// Path-based (instead of querystring) so the URL works under Next.js 16's
// images.localPatterns without listing every possible ?type=… value.

// Sharp uses native bindings — must run on the Node runtime, not Edge.
export const runtime = 'nodejs';

// Vercel's image optimizer refuses to re-encode upstream responses larger than
// 4 MB and just streams them through, which means the browser ends up decoding
// the original (multi-megapixel) JPEG into a tiny grid slot. We saw posters
// arrive at naturalWidth ≈ 8000 px, blowing the decoded-bitmap cache and
// causing scroll-back to repaint blank while the bitmap re-decoded. Resizing
// here keeps every upstream comfortably below the 4 MB cap.
const RESIZE_MAX_WIDTH = 2000;
const RESIZE_QUALITY = 82;
const PASSTHROUGH_MAX_BYTES = 3_500_000;

// Cache the resolved + resized binary across requests and dev restarts.
// Without this, every cache-cold image request re-downloads multi-MB from
// Airtable AND re-runs sharp encode — the dominant slowness on first paint.
// Returns base64 because unstable_cache JSON-serializes its values; raw
// Buffers don't survive the round-trip. ~33% size inflation is acceptable
// vs. the cost of re-fetching and re-encoding.
//
// Tagged 'films' so editor saves (which already revalidate that tag) also
// flush stale image bytes — no need to wait for the 1h TTL.
const _resolveAndResizeImage = unstable_cache(
  async (slug: string, type: string): Promise<{ data: string; contentType: string } | null> => {
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
    if (!upstream.ok) return null;

    const upstreamBuf = Buffer.from(await upstream.arrayBuffer());
    const upstreamCT = upstream.headers.get('content-type') ?? 'image/jpeg';

    let outBuf: Buffer = upstreamBuf;
    let outCT = upstreamCT;

    // Resize if the source either trips Vercel's 4 MB optimizer cap or has more
    // pixels than any srcset variant will ever request. Small, well-sized files
    // pass straight through to avoid an extra encode-decode round-trip.
    if (upstreamBuf.byteLength > PASSTHROUGH_MAX_BYTES) {
      outBuf = await sharp(upstreamBuf)
        .resize({ width: RESIZE_MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: RESIZE_QUALITY, mozjpeg: true })
        .toBuffer();
      outCT = 'image/jpeg';
    } else {
      const meta = await sharp(upstreamBuf).metadata();
      if ((meta.width ?? 0) > RESIZE_MAX_WIDTH) {
        outBuf = await sharp(upstreamBuf)
          .resize({ width: RESIZE_MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: RESIZE_QUALITY, mozjpeg: true })
          .toBuffer();
        outCT = 'image/jpeg';
      }
    }

    return { data: outBuf.toString('base64'), contentType: outCT };
  },
  ['film-img-v1'],
  { revalidate: 3600, tags: ['films'] },
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; type: string }> },
) {
  const { slug, type } = await ctx.params;

  const result = await _resolveAndResizeImage(slug, type);
  if (!result) return new NextResponse(null, { status: 404 });

  const buf = Buffer.from(result.data, 'base64');
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'content-type': result.contentType,
      // 1h matches the unstable_cache TTL so browser/CDN re-validate alongside
      // the server-side cache rotation. immutable would be wrong — editor saves
      // can flush via the 'films' tag at any time.
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
