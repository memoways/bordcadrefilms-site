import { Suspense } from "react";
import HomeHero from "./components/HomeHero";
import HomeAboutSection from "./components/HomeAboutSection";
import HomeNewsSection from "./components/HomeNewsSection";
import HomeFilmGridPreview from "./components/HomeFilmGridPreview";
import HomeDirectorsPreview from "./components/HomeDirectorsPreview";
import NewsCarouselSkeleton from "./components/NewsCarouselSkeleton";
import FilmGridSkeleton from "./components/FilmGridSkeleton";
import DirectorGridSkeleton from "./components/DirectorGridSkeleton";
import { getFilms } from "./lib/catalog";
import { readHeroVideo } from "./lib/hero";

export const revalidate = 900;

function HomeFilmPreviewFallback() {
  return (
    <section className="w-full py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-8 animate-pulse">
        <div className="h-8 w-56 mx-auto bg-zinc-200 rounded" />
        <FilmGridSkeleton />
        <div className="flex justify-center mt-4">
          <div className="h-10 w-44 rounded-lg bg-zinc-200" />
        </div>
      </div>
    </section>
  );
}

function HomeDirectorsPreviewFallback() {
  return (
    <section className="w-full py-12 md:py-20 bg-white text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-8 animate-pulse">
        <div className="h-8 w-72 mx-auto bg-zinc-200 rounded" />
        <DirectorGridSkeleton count={4} />
        <div className="flex justify-center mt-4">
          <div className="h-10 w-52 rounded bg-zinc-200" />
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [hero, films] = await Promise.all([readHeroVideo(), getFilms()]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col w-full min-h-screen bg-background text-foreground">
        <HomeHero hero={hero} />
        <Suspense fallback={<NewsCarouselSkeleton />}>
          <HomeNewsSection />
        </Suspense>
        <HomeAboutSection />
        <HomeFilmGridPreview films={films} />
        <Suspense fallback={<HomeDirectorsPreviewFallback />}>
          <HomeDirectorsPreview />
        </Suspense>
      </div>
    </div>
  );
}
