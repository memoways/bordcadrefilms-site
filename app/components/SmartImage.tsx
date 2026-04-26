"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

const RETRY_DELAYS_MS = [800, 2000, 5000];

type SmartImageProps = Omit<ImageProps, "onLoad" | "onError" | "onLoadingComplete"> & {
  skeletonClassName?: string;
};

export default function SmartImage({
  src,
  alt,
  className,
  skeletonClassName,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const escalatedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoaded(false);
    setAttempt(0);
    escalatedRef.current = false;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleError = () => {
    setLoaded(false);
    if (attempt >= RETRY_DELAYS_MS.length) {
      if (!escalatedRef.current && typeof window !== "undefined") {
        escalatedRef.current = true;
        window.dispatchEvent(new CustomEvent("bcf:image-failed"));
      }
      return;
    }
    const delay = RETRY_DELAYS_MS[attempt];
    timer.current = setTimeout(() => setAttempt((a) => a + 1), delay);
  };

  const handleLoad = () => {
    setLoaded(true);
    escalatedRef.current = false;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <>
      {!loaded && (
        <div
          className={`absolute inset-0 z-0 animate-pulse bg-zinc-200 ${skeletonClassName ?? ""}`.trim()}
          aria-hidden
        />
      )}
      {src && (
        <Image
          key={attempt}
          src={src}
          alt={alt}
          className={`${className ?? ""} ${loaded ? "" : "invisible"}`.trim()}
          {...rest}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </>
  );
}
