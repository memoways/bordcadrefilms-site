"use client";

import { useEffect, useRef, useState } from "react";
import type { BCFNumbersData } from "../lib/home";

function CounterItem({ number, label }: { number: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * number));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [number]);

  return (
    <div ref={ref} style={{ width: 164, minWidth: 120, padding: "0 16px 16px 0" }}>
      <div style={{ fontSize: 32, lineHeight: "43px", fontWeight: 400, color: "#F9D689" }}>
        {count}
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "#ffffff", marginTop: 16 }}>
        {label}
      </div>
    </div>
  );
}

export default function AboutCountersClient({ numbers }: { numbers: BCFNumbersData[] }) {
  return (
    <section
      style={{ backgroundColor: "#1C1C1C", padding: "32px 0 48px", color: "#ffffff" }}
      className="w-full"
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-8">
        {/* Left: title */}
        <div className="flex-shrink-0 md:w-[340px]">
          <h2
            style={{
              fontSize: 35,
              fontWeight: 300,
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Bord Cadre films
          </h2>
          <p
            style={{
              fontSize: 17.6,
              fontWeight: 300,
              color: "#ffffff",
              marginTop: 6,
              fontStyle: "normal",
            }}
          >
            by the numbers
          </p>
        </div>

        {/* Right: counters */}
        <div className="flex flex-wrap">
          {numbers.map((item) => (
            <CounterItem key={item.order} number={item.number} label={item.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
