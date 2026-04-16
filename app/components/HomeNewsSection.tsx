import { getNews } from '../lib/news';
import NewsCarousel from './NewsCarousel';

export default async function HomeNewsSection() {
  const items = await getNews();

  if (items.length === 0) {
    return (
      <section className="w-full bg-background text-foreground py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-900">News</h2>
          <p className="text-zinc-500 text-sm">No news available yet.</p>
        </div>
      </section>
    );
  }

  return <NewsCarousel items={items.slice(0, 3)} />;
}
