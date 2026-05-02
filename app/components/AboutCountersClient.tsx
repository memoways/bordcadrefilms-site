"use client";

import type { BCFNumbersData } from "../lib/home";

export default function AboutCountersClient({ numbers }: { numbers: BCFNumbersData[] }) {
  const featured = numbers.slice(0, 2);
  const rest = numbers.slice(2);

  return (
    <section className="w-full bg-[#111] py-16 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 md:gap-24">

        {/* Title */}
        <div className="md:w-64 flex-shrink-0 flex flex-col justify-start pt-1">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Bord Cadre films
          </h2>
          <p className="text-lg text-white/60 italic mt-2">by the numbers</p>
        </div>

        {/* Counters */}
        <div className="flex-1 flex flex-col gap-10">

          {/* First 2 — prominent, always side-by-side */}
          <div className="grid grid-cols-2 gap-x-2">
            {featured.map((item) => (
              <div key={item.order} className="flex flex-col gap-2">
                <span className="text-[3rem] sm:text-[4rem] font-sans font-medium text-[#E0A75D] leading-none tabular-nums">
                  {item.number}
                </span>
                <span className="text-white text-sm sm:text-base leading-snug">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Rest — smaller, wrap into columns */}
          {rest.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-8">
              {rest.map((item) => (
                <div key={item.order} className="flex flex-col gap-1">
                  <span className="text-[1.5rem] sm:text-[2rem] font-sans font-medium text-[#E0A75D] leading-none tabular-nums">
                    {item.number}
                  </span>
                  <span className="text-white/75 text-xs sm:text-sm leading-snug">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
