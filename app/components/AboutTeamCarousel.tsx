"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { TeamMemberData } from "../lib/about";

// ── TeamCard ──────────────────────────────────────────────────────────────────

function TeamCard({ member }: { member: TeamMemberData }) {
  return (
    <article className="flex flex-col items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm h-full">
      {/* Circular avatar */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="text-zinc-400" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="text-center text-sm leading-relaxed text-zinc-600 grow">
          {member.bio}
        </p>
      )}

      {/* Name + role */}
      <div className="text-center">
        <p className="text-xl font-semibold" style={{ color: "#C0392B" }}>
          {member.name}
        </p>
        {member.role && (
          <p className="mt-1 text-sm text-zinc-500">{member.role}</p>
        )}
      </div>
    </article>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm animate-pulse">
      <div className="h-28 w-28 rounded-full bg-zinc-200" />
      <div className="w-full space-y-2 grow">
        <div className="h-3 rounded bg-zinc-200 w-full" />
        <div className="h-3 rounded bg-zinc-200 w-5/6 mx-auto" />
        <div className="h-3 rounded bg-zinc-200 w-4/5 mx-auto" />
      </div>
      <div className="space-y-2 text-center">
        <div className="h-5 w-36 rounded bg-zinc-200 mx-auto" />
        <div className="h-3 w-24 rounded bg-zinc-200 mx-auto" />
      </div>
    </div>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────

const DESKTOP_PER_PAGE = 2;

type Props = { members: TeamMemberData[] };

export default function AboutTeamCarousel({ members }: Props) {
  // Desktop: index of first visible card
  const [desktopStart, setDesktopStart] = useState(0);
  // Mobile: index of visible card
  const [mobileIndex, setMobileIndex] = useState(0);
  const dragStart = useRef<number | null>(null);

  const total = members.length;

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <section className="w-full py-16 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-4xl font-light text-zinc-900">The team</h2>
          <div className="h-48 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center">
            <p className="text-sm text-zinc-400">Team coming soon.</p>
          </div>
        </div>
      </section>
    );
  }

  // ── Desktop carousel logic ───────────────────────────────────────────────────
  // Clamp so we never show an empty second slot when near the end
  const maxDesktopStart = Math.max(0, total - DESKTOP_PER_PAGE);
  const clampedDesktopStart = Math.min(desktopStart, maxDesktopStart);
  const desktopSlice = members.slice(clampedDesktopStart, clampedDesktopStart + DESKTOP_PER_PAGE);
  const desktopNeedsCarousel = total > DESKTOP_PER_PAGE;

  // Number of dot steps on desktop = total - (DESKTOP_PER_PAGE - 1), min 1
  const desktopDotCount = Math.max(1, total - DESKTOP_PER_PAGE + 1);

  const desktopPrev = () => setDesktopStart((s) => Math.max(0, s - 1));
  const desktopNext = () => setDesktopStart((s) => Math.min(maxDesktopStart, s + 1));

  // ── Mobile carousel logic ────────────────────────────────────────────────────
  const mobileNeedsCarousel = total > 1;
  const mobilePrev = () => setMobileIndex((i) => Math.max(0, i - 1));
  const mobileNext = () => setMobileIndex((i) => Math.min(total - 1, i + 1));

  // ── Drag/swipe shared ────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => { dragStart.current = e.clientX; };
  const onMouseUp = (isMobile: boolean) => (e: React.MouseEvent) => {
    if (dragStart.current === null) return;
    const delta = e.clientX - dragStart.current;
    if (Math.abs(delta) > 50) {
      if (isMobile) { delta < 0 ? mobileNext() : mobilePrev(); }
      else { delta < 0 ? desktopNext() : desktopPrev(); }
    }
    dragStart.current = null;
  };
  const onTouchStart = (e: React.TouchEvent) => { dragStart.current = e.touches[0].clientX; };
  const onTouchEnd = (isMobile: boolean) => (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const delta = e.changedTouches[0].clientX - dragStart.current;
    if (Math.abs(delta) > 40) {
      if (isMobile) { delta < 0 ? mobileNext() : mobilePrev(); }
      else { delta < 0 ? desktopNext() : desktopPrev(); }
    }
    dragStart.current = null;
  };

  // ── Layout helper for desktop card grid ─────────────────────────────────────
  // 1 card visible (total=1 or last odd): center it
  // 2 cards visible: equal side-by-side
  const desktopGridClass = desktopSlice.length === 1
    ? "flex justify-center"
    : "grid grid-cols-2 gap-6";

  const desktopCardClass = desktopSlice.length === 1
    ? "w-full max-w-md"
    : "";

  return (
    <section className="w-full py-16 px-6 bg-zinc-50 select-none">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-light text-zinc-900 mb-10">The team</h2>

        {/* ── DESKTOP (md+) ── */}
        <div className="hidden md:block">
          <div className="flex items-stretch gap-4">
            {/* Prev arrow — only shown when carousel is needed */}
            {desktopNeedsCarousel && (
              <button
                type="button"
                onClick={desktopPrev}
                disabled={clampedDesktopStart === 0}
                aria-label="Previous"
                className="self-center shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* Cards */}
            <div
              className="flex-1 overflow-hidden"
              onMouseDown={desktopNeedsCarousel ? onMouseDown : undefined}
              onMouseUp={desktopNeedsCarousel ? onMouseUp(false) : undefined}
              onMouseLeave={() => { dragStart.current = null; }}
              onTouchStart={desktopNeedsCarousel ? onTouchStart : undefined}
              onTouchEnd={desktopNeedsCarousel ? onTouchEnd(false) : undefined}
              style={desktopNeedsCarousel ? { cursor: "grab" } : undefined}
            >
              <div className={desktopGridClass}>
                {desktopSlice.map((member) => (
                  <div key={member.id} className={desktopCardClass}>
                    <TeamCard member={member} />
                  </div>
                ))}
              </div>
            </div>

            {/* Next arrow */}
            {desktopNeedsCarousel && (
              <button
                type="button"
                onClick={desktopNext}
                disabled={clampedDesktopStart >= maxDesktopStart}
                aria-label="Next"
                className="self-center shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>

          {/* Desktop dots */}
          {desktopNeedsCarousel && desktopDotCount > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: desktopDotCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to position ${i + 1}`}
                  onClick={() => setDesktopStart(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === clampedDesktopStart
                      ? "w-6 h-2 bg-zinc-700"
                      : "w-2 h-2 bg-zinc-300 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── MOBILE (<md) ── */}
        <div className="md:hidden">
          <div className="flex items-stretch gap-3">
            {mobileNeedsCarousel && (
              <button
                type="button"
                onClick={mobilePrev}
                disabled={mobileIndex === 0}
                aria-label="Previous"
                className="self-center shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div
              className="flex-1"
              onMouseDown={mobileNeedsCarousel ? onMouseDown : undefined}
              onMouseUp={mobileNeedsCarousel ? onMouseUp(true) : undefined}
              onMouseLeave={() => { dragStart.current = null; }}
              onTouchStart={mobileNeedsCarousel ? onTouchStart : undefined}
              onTouchEnd={mobileNeedsCarousel ? onTouchEnd(true) : undefined}
              style={mobileNeedsCarousel ? { cursor: "grab" } : undefined}
            >
              <TeamCard member={members[mobileIndex]} />
            </div>

            {mobileNeedsCarousel && (
              <button
                type="button"
                onClick={mobileNext}
                disabled={mobileIndex === total - 1}
                aria-label="Next"
                className="self-center shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile dots */}
          {mobileNeedsCarousel && (
            <div className="mt-5 flex justify-center gap-2">
              {members.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Member ${i + 1}`}
                  onClick={() => setMobileIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === mobileIndex
                      ? "w-6 h-2 bg-zinc-700"
                      : "w-2 h-2 bg-zinc-300 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
