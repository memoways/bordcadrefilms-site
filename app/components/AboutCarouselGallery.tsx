"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type GalleryPhoto = {
  id: string;
  title: string;
  description?: string;
  image: string;
  festival?: string;
  year?: string;
  order: number;
};

type GalleryFromAPI = {
  photos: GalleryPhoto[];
  total: number;
  source: string;
};

export default function AboutCarouselGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await fetch("/api/festival-photos", {
          next: { revalidate: 3600, tags: ["festival-photos"] },
        } as RequestInit);

        if (res.ok) {
          const json = (await res.json()) as { ok: boolean; data?: GalleryFromAPI };
          if (json.ok && json.data?.photos) {
            setPhotos(json.data.photos.sort((a, b) => a.order - b.order));
          }
        }
      } catch (error) {
        console.error("[AboutCarouselGallery] Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (loading) {
    return (
      <section className="w-full py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="h-96 rounded-3xl bg-zinc-200 animate-pulse" />
        </div>
      </section>
    );
  }

  if (photos.length === 0) return null;

  const current = photos[activeIdx];

  return (
    <section className="w-full py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <h2 className="text-4xl font-semibold text-zinc-900">Festival Gallery</h2>

        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800">
          <div className="relative w-full h-96 md:h-[500px]">
            <Image src={current.image} alt={current.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 100vw" priority />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-3xl font-semibold text-zinc-900">{current.title}</h3>
            {current.description && <p className="text-lg text-zinc-700 leading-relaxed">{current.description}</p>}
            <div className="flex gap-4 text-sm text-zinc-600">
              {current.festival && <span>{current.festival}</span>}
              {current.year && <span>{current.year}</span>}
            </div>
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 justify-center flex-wrap">
            {photos.map((photo, idx) => (
              <button key={photo.id} onClick={() => setActiveIdx(idx)} className={`h-3 rounded-full transition ${activeIdx === idx ? "bg-zinc-900 w-8" : "bg-zinc-300 w-3"}`} aria-label={`Go to photo ${idx + 1}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}