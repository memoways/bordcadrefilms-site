"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

const RETRY_DELAYS_MS = [800, 2000, 5000];

type SmartImageProps = Omit<
  ImageProps,
  "onLoad" | "onError" | "onLoadingComplete"
> & {
  skeletonClassName?: string;
  unoptimized?: boolean;
};

export default function SmartImage({
  src,
  alt,
  className,
  skeletonClassName,
  unoptimized,
  placeholder,
  blurDataURL,
  loading,
  style,
  ...rest
}: SmartImageProps) {
  // Strip `background` shorthand from caller styles. next/image's
  // placeholder="blur" sets backgroundImage/Size/Position/Repeat longhand
  // and removes them on load — React warns when a longhand is removed
  // while a conflicting shorthand stays on the element.
  const safeStyle = (() => {
    if (!style || !("background" in style)) return style;
    const { background, ...others } = style as React.CSSProperties & {
      background?: string;
    };
    return {
      ...others,
      backgroundColor: others.backgroundColor ?? background,
    };
  })();
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleError = () => {
    setLoaded(false);
    // Skip retry for the same-origin /api/img/ proxy. The proxy is
    // authoritative: 200 means image, 404 means genuine miss (cached 5m),
    // 502 means transient upstream (server-side retry on next request).
    // Retrying client-side just multiplies dead requests.
    if (typeof src === "string" && src.includes("/api/img/")) return;
    if (attempt >= RETRY_DELAYS_MS.length) return;
    const delay = RETRY_DELAYS_MS[attempt];
    timer.current = setTimeout(() => setAttempt((a) => a + 1), delay);
  };

  const handleLoad = () => {
    setLoaded(true);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <>
      {!loaded && !placeholder && (
        <div
          className={`absolute inset-0 z-0 animate-pulse ${skeletonClassName ?? "bg-zinc-200"}`.trim()}
          aria-hidden
        />
      )}
      {src && (
        <Image
          key={attempt}
          src={src}
          alt={alt}
          className={`${className ?? ""} transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`.trim()}
          {...rest}
          style={safeStyle}
          unoptimized={unoptimized}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </>
  );
}
