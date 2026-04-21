"use client";

import { useEffect, useRef, useState } from "react";
import type { BCFNumbersData } from "../lib/home";

function Counter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={spanRef}>{count}</span>;
}

export default function AboutCountersClient({ numbers }: { numbers: BCFNumbersData[] }) {
  return (
    <section className="w-full bg-[#111] py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24">
        {/* Title */}
        <div className="md:w-64 flex-shrink-0 flex flex-col justify-start pt-1">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Bord Cadre films
          </h2>
          <p className="text-lg text-white/60 italic mt-2">by the numbers</p>
        </div>

        {/* Counter grid */}
        <div className="flex-1 grid grid-cols-2 gap-x-10 gap-y-12">
          {numbers.map((item) => (
            <div key={item.order} className="flex flex-col gap-2">
              <span className="text-6xl md:text-7xl font-bold text-[#E0A75D] leading-none tabular-nums">
                <Counter target={item.number} />
              </span>
              <span className="text-white text-sm md:text-base leading-snug mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
