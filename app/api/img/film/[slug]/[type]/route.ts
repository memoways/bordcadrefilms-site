import { NextResponse } from 'next/server';
import { readAirtableFilms } from '@/app/lib/airtable';

// Resolves /api/img/film/<slug>/<type> to a 302 redirect pointing at the
// currently-valid Airtable signed URL.
//
// `type` is one of:  poster | profile | festival | image-N (N = 0-indexed)
//
// Why the proxy: Airtable signed URLs rotate every ~15 min and expire ~2h.
// A stable same-origin URL means HTML never holds a dying URL, the optimizer
// can cache the optimized blob by stable key, and idle tabs recover by simply
// re-following the redirect on the next request.
//
// Path-based (instead of querystring) so the URL works under Next.js 16's
// images.localPatterns without listing every possible ?type=… value.

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; type: string }> },
) {
  const { slug, type } = await ctx.params;

  const films = await readAirtableFilms();
  const film = films.find((f) => f.slug === slug);
  if (!film) return new NextResponse(null, { status: 404 });

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

  if (!url) return new NextResponse(null, { status: 404 });

  // Stream the bytes through, rather than 302-redirecting. Next.js's image
  // optimizer's internal fetch does NOT follow redirects to remote hosts,
  // so a 302 to airtableusercontent.com would surface as a 400 "not a valid
  // image". Streaming keeps the URL same-origin from the optimizer's POV.
  // Origin fetch is hit at most once per (slug, type, width) tuple — the
  // optimizer caches the resized output for `minimumCacheTTL` (1h) afterwards.
  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(null, { status: upstream.status || 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'cache-control': 'public, max-age=900, s-maxage=900',
    },
  });
}
