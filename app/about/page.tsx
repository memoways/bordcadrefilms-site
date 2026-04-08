import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import AboutCarouselGallery from "../components/AboutCarouselGallery";
import AboutFounderBio from "../components/AboutFounderBio";
import AboutTeamCarousel from "../components/AboutTeamCarousel";
import AboutCounters from "../components/AboutCounters";

export const metadata: Metadata = {
  title: "À propos — Bord Cadre Films",
  description: "Découvrez Bord Cadre Films, société de production cinématographique basée à Genève, spécialisée dans les films d'auteur et les coproductions internationales.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-16">
        <section className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">À propos de Bord Cadre Films</h1>
            <p className="text-lg text-zinc-700 leading-relaxed max-w-2xl">
              Bord Cadre Films est une société de production cinématographique basée à Genève, spécialisée dans la production de films d’auteur, longs et courts métrages, avec une présence internationale dans les festivals et coproductions.
            </p>
            <p className="text-lg text-zinc-700 leading-relaxed max-w-2xl">
              Notre mission est de soutenir la création indépendante et de promouvoir des œuvres singulières, portées par des réalisateurs et réalisatrices du monde entier.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <Image src="/website%20screen/about1.png" alt="About Bord Cadre Films" width={800} height={400} className="rounded-2xl shadow-sm" />
            <Image src="/website%20screen/about2.png" alt="About Bord Cadre Films 2" width={800} height={400} className="rounded-2xl shadow-sm" />
          </div>
        </section>

        <Suspense fallback={<div className="h-64 rounded-3xl bg-zinc-100 animate-pulse" />}>
          <AboutCarouselGallery />
        </Suspense>

        <Suspense fallback={<div className="h-72 rounded-3xl bg-zinc-100 animate-pulse" />}>
          <AboutFounderBio />
        </Suspense>

        <Suspense fallback={<div className="h-72 rounded-3xl bg-zinc-100 animate-pulse" />}>
          <AboutTeamCarousel />
        </Suspense>

        <Suspense fallback={<div className="h-48 rounded-3xl bg-zinc-100 animate-pulse" />}>
          <AboutCounters />
        </Suspense>
      </div>
    </main>
  );
}
