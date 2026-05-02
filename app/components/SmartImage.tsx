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
  ...rest
}: SmartImageProps) {
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
      {!loaded && (
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
          unoptimized={unoptimized}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </>
  );
}
