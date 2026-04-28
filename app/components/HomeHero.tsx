import Link from "next/link";
import type { HeroVideoData } from "../lib/hero";

type HomeHeroProps = {
  hero: HeroVideoData;
};

export default function HomeHero({ hero }: HomeHeroProps) {
  const title = hero.title || "Bord Cadre Films";
  const subtitle =
    hero.subtitle ||
    "Independent film production company based in Geneva, specialising in arthouse features and short films, with an international presence at festivals and co-productions.";

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center relative text-white overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={hero.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        style={{ minHeight: "100vh", minWidth: "100vw" }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-[#1f1f1f]/60 to-[#1f1f1f]/80" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-screen px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-center mt-4 text-white drop-shadow-sm">{title}</h1>
        <p className="text-lg md:text-xl text-center max-w-2xl mt-2 text-zinc-200">{subtitle}</p>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Link href="/films" prefetch className="px-6 py-3 rounded-lg brand-btn-primary font-normal transition-all duration-150 shadow-sm">
            View films
          </Link>
          <Link href="/directors" prefetch className="px-6 py-3 rounded-lg border border-zinc-400 text-white font-normal hover:bg-zinc-200/10 transition-all duration-150 shadow-sm">
            Directors
          </Link>
        </div>
      </div>
    </section>
  );
}
