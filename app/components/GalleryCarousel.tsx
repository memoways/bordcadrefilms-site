"use client";

import { useRef, useState, useEffect } from "react";
import SmartImage from "./SmartImage";

interface GalleryImage {
  url: string;
  alt: string;
}

export default function GalleryCarousel({ images, title }: { images: GalleryImage[]; title: string }) {
  const n = images.length;
  const [startIdx, setStartIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragMoved = useRef(false);

  const mod = (i: number) => ((i % n) + n) % n;

  const navigate = (dir: "prev" | "next") => {
    setStartIdx((s) => mod(dir === "next" ? s + 3 : s - 3));
  };

  // Keyboard: lightbox nav + carousel nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        if (e.key === "Escape") setLightbox(null);
        if (e.key === "ArrowRight") setLightbox((i) => i !== null ? mod(i + 1) : null);
        if (e.key === "ArrowLeft") setLightbox((i) => i !== null ? mod(i - 1) : null);
      } else {
        if (e.key === "ArrowRight") navigate("next");
        if (e.key === "ArrowLeft") navigate("prev");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    dragMoved.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 8) {
      dragMoved.current = true;
    }
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 50) navigate(delta < 0 ? "next" : "prev");
    dragStartX.current = null;
  };

  if (n === 0) return null;

  // Build indices: [peekLeft, img0, img1, img2, peekRight]
  // For fewer than 5 images, skip peek
  const showPeek = n >= 5;
  const slots = showPeek
    ? [mod(startIdx - 1), mod(startIdx), mod(startIdx + 1), mod(startIdx + 2), mod(startIdx + 3)]
    : Array.from({ length: Math.min(n, 3) }, (_, i) => mod(startIdx + i));

  const totalPages = Math.ceil(n / 3);
  const currentPage = Math.floor(startIdx / 3);

  const current = lightbox !== null ? images[lightbox] : null;

  return (
    <>
      <div
        className="relative w-full select-none overflow-hidden"
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragStartX.current = null; }}
      >
        {/* Image row — centered */}
        <div className="flex items-center justify-center gap-4 py-2">
          {slots.map((imgIdx, pos) => {
            const isBlurred = showPeek && (pos === 0 || pos === slots.length - 1);
            const img = images[imgIdx];

            return (
              <div
                key={`${pos}-${imgIdx}`}
                onClick={() => { if (!isBlurred && !dragMoved.current) setLightbox(imgIdx); }}
                className="group relative shrink-0 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800 transition-all duration-300"
                style={{
                  width: isBlurred ? 160 : 300,
                  height: 210,
                  filter: isBlurred ? "blur(4px)" : "none",
                  opacity: isBlurred ? 0.45 : 1,
                  cursor: isBlurred ? "default" : "pointer",
                  transition: "filter 0.3s, opacity 0.3s, width 0.4s",
                  pointerEvents: isBlurred ? "none" : "auto",
                }}
              >
                {img.url ? (
                  <SmartImage
                    src={img.url}
                    alt={img.alt || `${title} — image ${imgIdx + 1}`}
                    fill
                    sizes={isBlurred ? "160px" : "300px"}
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    draggable={false}
                    skeletonClassName="bg-zinc-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <svg className="text-zinc-600" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <circle cx="12" cy="13.5" r="3" />
                      <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    </svg>
                  </div>
                )}
                {/* Hover zoom hint */}
                {!isBlurred && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/15">
                    <svg
                      className="opacity-0 drop-shadow-md transition-opacity duration-300 group-hover:opacity-100"
                      width="34" height="34" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Arrows — always visible when n > 3 */}
        {n > 3 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("prev"); }}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/25"
              aria-label="Previous"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("next"); }}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/25"
              aria-label="Next"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {totalPages > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStartIdx(i * 3)}
                className={`h-1.5 rounded-full transition-all duration-300 ${currentPage === i ? "w-6 bg-[#E0A75D]" : "w-1.5 bg-white/30"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <p className="absolute top-6 left-1/2 -translate-x-1/2 text-sm text-white/50">
            {lightbox + 1} / {n}
          </p>

          <button
            className="absolute left-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setLightbox(mod(lightbox - 1)); }}
            aria-label="Previous image"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            className="absolute right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setLightbox(mod(lightbox + 1)); }}
            aria-label="Next image"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div
            className="relative overflow-hidden rounded-xl"
            style={{ maxWidth: "90vw", maxHeight: "85vh", width: "90vw", height: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.url ? (
              <SmartImage
                src={current.url}
                alt={current.alt}
                fill
                sizes="90vw"
                className="object-contain"
                priority
                skeletonClassName="bg-zinc-900"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <svg className="text-zinc-600" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <circle cx="12" cy="13.5" r="3" />
                  <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
