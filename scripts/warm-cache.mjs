/**
 * Cache Warming Script
 * 
 * Targets the /api/img/film proxy directly to populate unstable_cache
 * and sharp-encoded blobs. This is the real bottleneck layer.
 * 
 * Usage:
 *   node scripts/warm-cache.mjs <base-url> [slug1 slug2 ...]
 */

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const CLI_SLUGS = process.argv.slice(3);

// Fallback slugs if none provided
const DEFAULT_SLUGS = [
  'le-proces-du-chien',
  'banel-and-adama',
  'la-chimera',
  'the-old-oak',
  'vers-un-avenir-radieux'
];

const slugs = CLI_SLUGS.length > 0 ? CLI_SLUGS : DEFAULT_SLUGS;
const BATCH_SIZE = 2; // Low concurrency to avoid Vercel CPU limits/Airtable 429

async function warm() {
  console.log(`\n🚀 Warming cache for ${BASE_URL}`);
  console.log(`📦 Slugs: ${slugs.join(', ')}`);
  console.log(`⚡ Concurrency: ${BATCH_SIZE}\n`);

  const endpoints = slugs.flatMap(slug => [
    `/api/img/film/${slug}/poster?w=640`,
    `/api/img/film/${slug}/poster?w=384`,
    `/api/img/film/${slug}/profile?w=144`,
  ]);

  const results = { success: 0, fail: 0 };

  for (let i = 0; i < endpoints.length; i += BATCH_SIZE) {
    const batch = endpoints.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (path) => {
      const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
      try {
        const start = Date.now();
        const res = await fetch(url);
        const duration = Date.now() - start;
        
        if (res.ok) {
          console.log(`✅ [${res.status}] ${duration}ms - ${path}`);
          results.success++;
        } else {
          console.log(`❌ [${res.status}] ${path}`);
          results.fail++;
        }
      } catch (err) {
        console.log(`💥 ERROR - ${path}: ${err.message}`);
        results.fail++;
      }
    }));
  }

  console.log(`\n✨ Done! Success: ${results.success}, Failed: ${results.fail}`);
}

warm().catch(console.error);
