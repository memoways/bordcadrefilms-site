import Image from "next/image";
import type { FounderBioData } from "../lib/about";

type Props = {
  founder: FounderBioData;
};

export default function AboutFounderBio({ founder }: Props) {
  const paragraphs = founder.bio
    .split(/\n\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="bg-white py-14 md:py-20 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 md:gap-14 items-start">

        {/* Image — fixed-size portrait, not full-bleed */}
        <div className="shrink-0 mx-auto md:mx-0 w-48 md:w-56">
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
            {founder.image ? (
              <Image
                src={founder.image}
                alt={founder.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 192px, 224px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-200">
                <svg className="text-zinc-400" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3 min-w-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-zinc-900 leading-tight">
            {founder.name}
          </h2>
          {founder.title && (
            <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
              {founder.title}
            </p>
          )}
          <div className="mt-1 space-y-3 max-w-2xl">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-zinc-700 leading-relaxed text-sm md:text-base">
                {p}
              </p>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
