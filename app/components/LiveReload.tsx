"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const IDLE_THRESHOLD_MS = 90 * 60 * 1000;
const REFRESH_DEBOUNCE_MS = 3000;
const REFRESH_COOLDOWN_MS = 30_000;

export default function LiveReload() {
  const router = useRouter();
  const lastActiveRef = useRef<number>(0);
  const lastRefreshRef = useRef<number>(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastActiveRef.current = Date.now();

    const refreshImmediate = () => {
      lastRefreshRef.current = Date.now();
      router.refresh();
    };

    const refreshThrottled = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_COOLDOWN_MS) return;
      lastRefreshRef.current = now;
      router.refresh();
    };

    const refreshDebouncedThrottled = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(refreshThrottled, REFRESH_DEBOUNCE_MS);
    };

    const onRevalidate = () => refreshImmediate();
    window.addEventListener("bcf:revalidate", onRevalidate);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("bcf:revalidate");
      channel.addEventListener("message", onRevalidate);
    }

    const onImageFailed = () => refreshDebouncedThrottled();
    window.addEventListener("bcf:image-failed", onImageFailed);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const idleMs = Date.now() - lastActiveRef.current;
        if (idleMs > IDLE_THRESHOLD_MS) refreshThrottled();
      }
      lastActiveRef.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const idleMs = Date.now() - lastActiveRef.current;
        if (idleMs > IDLE_THRESHOLD_MS) refreshThrottled();
        lastActiveRef.current = Date.now();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("bcf:revalidate", onRevalidate);
      window.removeEventListener("bcf:image-failed", onImageFailed);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      if (channel) {
        channel.removeEventListener("message", onRevalidate);
        channel.close();
      }
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [router]);

  return null;
}
