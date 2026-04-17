import type { Metadata } from "next";
import { readHomeAbout } from "../lib/home";
import { readFounderBio, readFestivalPhotos, readTeam } from "../lib/about";
import AboutIntro from "../components/AboutIntro";
import AboutCarouselGallery from "../components/AboutCarouselGallery";
import AboutFounderBio from "../components/AboutFounderBio";
import AboutTeamCarousel from "../components/AboutTeamCarousel";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About — Bord Cadre Films",
  description:
    "Discover Bord Cadre Films, an independent production company based in Geneva, specialising in arthouse cinema and international co-productions.",
};

export default async function AboutPage() {
  const [about, founder, { photos }, { members }] = await Promise.all([
    readHomeAbout(),
    readFounderBio(),
    readFestivalPhotos(),
    readTeam(),
  ]);

  return (
    <main className="flex flex-col min-h-screen bg-white text-zinc-900">
      <AboutIntro description={about.description} />
      {photos.length > 0 && <AboutCarouselGallery photos={photos} />}
      <AboutFounderBio founder={founder} />
      <AboutTeamCarousel members={members} />
    </main>
  );
}
