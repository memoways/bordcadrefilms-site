"use client";

import { useState } from "react";
import SmartImage from "./SmartImage";
import type { FestivalPhotoData } from "../lib/about";

type Props = {
  photos: FestivalPhotoData[];
};

const VISIBLE = 3;

export default function AboutCarouselGallery({ photos }: Props) {
  const [start, setStart] = useState(0);

  const canPrev = start > 0;
  const canNext = start + VISIBLE < photos.length;
  const shown = photos.slice(start, start + VISIBLE);

  return (
    <section className="bg-zinc-950 py-10 md:py-14 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shown.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800"
            >
              <SmartImage
                src={photo.image}
                alt={photo.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                skeletonClassName="bg-zinc-800"
              />
            </div>
          ))}
        </div>

        {photos.length > VISIBLE && (
          <div className="flex justify-center items-center gap-8">
            <button
              type="button"
              onClick={() => setStart((i) => Math.max(0, i - 1))}
              disabled={!canPrev}
              aria-label="Photos précédentes"
              className="text-white text-3xl leading-none disabled:text-zinc-700 hover:text-zinc-300 transition-colors"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setStart((i) => Math.min(photos.length - VISIBLE, i + 1))}
              disabled={!canNext}
              aria-label="Photos suivantes"
              className="text-white text-3xl leading-none disabled:text-zinc-700 hover:text-zinc-300 transition-colors"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
