"use client";

import { useEffect, useState } from "react";
import SmartImage from "./SmartImage";
import type { FilmVideo } from "@/app/lib/airtable";

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function getEmbedUrl(url: string): string | null {
  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`;
  const vm = getVimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}?autoplay=1`;
  return null;
}

function inferThumbnail(video: FilmVideo): string | undefined {
  if (video.thumbnail) return video.thumbnail;
  const yt = getYouTubeId(video.url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return undefined;
}

function VideoThumb({ video, onClick }: { video: FilmVideo; onClick: () => void }) {
  const thumb = inferThumbnail(video);
  const langLabel = video.language ? ` · ${video.language}` : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex aspect-video w-full overflow-hidden rounded-xl border border-zinc-300 bg-zinc-200 shadow-sm transition hover:shadow-md"
      aria-label={`Play video: ${video.title}`}
    >
      {thumb ? (
        <SmartImage
          src={thumb}
          alt={video.title}
          fill
          sizes="(max-width: 1024px) 100vw, 300px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          skeletonClassName="bg-zinc-300"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-300" aria-hidden />
      )}
      <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/45" aria-hidden />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform duration-300 group-hover:scale-110">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1C1C1C" aria-hidden>
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </span>
      </span>
      <span className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-left text-sm font-semibold text-white sm:text-base">
        {video.title}
        {langLabel && <span className="ml-1 font-normal text-white/70">{langLabel}</span>}
      </span>
    </button>
  );
}

export default function FilmVideos({ videos }: { videos: FilmVideo[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const total = videos.length;
  const mod = (i: number) => ((i % total) + total) % total;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active !== null) {
        if (e.key === "Escape") setActive(null);
      } else if (total > 1) {
        if (e.key === "ArrowLeft") setSlide((s) => mod(s - 1));
        if (e.key === "ArrowRight") setSlide((s) => mod(s + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, total]);

  useEffect(() => {
    document.body.style.overflow = active !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  if (total === 0) return null;

  const modalVideo = active !== null ? videos[active] : null;
  const embedUrl = modalVideo ? getEmbedUrl(modalVideo.url) : null;

  return (
    <>
      {/* Mobile / tablet: carousel (single video, arrows + dots) */}
      <div className="w-full lg:hidden">
        <div className="relative">
          <VideoThumb video={videos[slide]} onClick={() => setActive(slide)} />

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlide((s) => mod(s - 1));
                }}
                className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-black/70"
                aria-label="Previous video"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlide((s) => mod(s + 1));
                }}
                className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-black/70"
                aria-label="Next video"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {videos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-6 bg-[#E0A75D]" : "w-1.5 bg-zinc-400/60 hover:bg-zinc-500"}`}
                aria-label={`Go to video ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop (lg+): stacked vertical list, all videos visible */}
      <div className="hidden lg:flex lg:flex-col lg:gap-4">
        {videos.map((video, idx) => (
          <VideoThumb key={`${video.url}-${idx}`} video={video} onClick={() => setActive(idx)} />
        ))}
      </div>

      {/* Modal — shared between mobile + desktop */}
      {modalVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={modalVideo.title}
        >
          <button
            type="button"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={modalVideo.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                <p>This video can&apos;t be embedded here.</p>
                <a
                  href={modalVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-[#E0A75D] px-4 py-2 text-sm font-semibold text-zinc-900"
                >
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
