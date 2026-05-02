// Standalone perf probe — measures /films image-loading after the srcset
// restoration. Runs Playwright chromium against a deployed URL (no local
// webServer). Usage:
//   node scripts/perf-image-load.mjs <preview-url>

import { chromium } from 'playwright';

const BASE = process.argv[2];
if (!BASE) {
  console.error('Usage: node scripts/perf-image-load.mjs <preview-url>');
  process.exit(1);
}

const summarize = (entries) => {
  if (!entries.length) return null;
  const durations = entries.map((e) => e.duration).sort((a, b) => a - b);
  const sum = (xs) => xs.reduce((s, n) => s + n, 0);
  const total = sum(entries.map((e) => e.transferSize));
  return {
    count: entries.length,
    avgMs: Math.round(sum(durations) / entries.length),
    p50Ms: Math.round(durations[Math.floor(durations.length / 2)]),
    p95Ms: Math.round(durations[Math.floor(durations.length * 0.95)]),
    maxMs: Math.round(durations.at(-1)),
    totalKB: Math.round(total / 1024),
    avgKB: Math.round(total / entries.length / 1024),
  };
};

const collectImg = (page) =>
  page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter(
        (e) =>
          (e.initiatorType === 'img' || /\/(api\/img|_next\/image)/.test(e.name)),
      )
      .map((e) => ({
        url: e.name,
        duration: e.duration,
        transferSize: e.transferSize,
        encodedBodySize: e.encodedBodySize,
        decodedBodySize: e.decodedBodySize,
      })),
  );

const browser = await chromium.launch();
const ctx = await browser.newContext({
  // Disable HTTP cache so we measure cold-browser, warm-CDN — the realistic
  // first-visit scenario for any new user landing on the preview URL.
  bypassCSP: true,
});
await ctx.route('**/*', (route) => route.continue());

const page = await ctx.newPage();
await page.goto(`${BASE}/films`, { waitUntil: 'networkidle' });

console.log(`\n=== /films initial paint (cold browser, warm CDN) ===`);
const initial = await collectImg(page);
const initSrcset = initial.filter((e) => /_next\/image/.test(e.url));
const initDirect = initial.filter((e) => /\/api\/img\//.test(e.url) && !/_next\/image/.test(e.url));
console.log('via /_next/image (srcset path):', summarize(initSrcset) ?? 'none');
console.log('direct /api/img (no optimizer):', summarize(initDirect) ?? 'none');

// Click "Load more"
const loadMore = page.getByRole('button', { name: /load more/i });
if (await loadMore.count()) {
  await loadMore.click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');

  console.log(`\n=== after Load more + scroll-to-bottom ===`);
  const after = await collectImg(page);
  const afterSrcset = after.filter((e) => /_next\/image/.test(e.url));
  const afterDirect = after.filter((e) => /\/api\/img\//.test(e.url) && !/_next\/image/.test(e.url));
  console.log('via /_next/image (cumulative):', summarize(afterSrcset) ?? 'none');
  console.log('direct /api/img (cumulative):', summarize(afterDirect) ?? 'none');

  // Sample 5 slowest individual requests for sanity-check
  const slowest = [...after].sort((a, b) => b.duration - a.duration).slice(0, 5);
  console.log(`\nSlowest 5 image requests:`);
  for (const e of slowest) {
    const path = e.url.includes('?url=')
      ? decodeURIComponent(e.url.split('?url=')[1].split('&')[0]).slice(-60)
      : e.url.slice(-60);
    console.log(
      `  ${Math.round(e.duration).toString().padStart(5)}ms  ${(e.transferSize / 1024).toFixed(1).padStart(7)}KB  ${path}`,
    );
  }
}

await browser.close();
