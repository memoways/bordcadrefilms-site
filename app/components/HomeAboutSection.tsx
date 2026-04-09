import Link from "next/link";
import { readHomeAbout } from "@/app/lib/home";

export default async function HomeAboutSection() {
  const data = await readHomeAbout();

  return (
    <section className="w-full flex justify-center py-16 px-4 bg-white text-zinc-900">
      <div className="max-w-3xl w-full rounded-2xl p-8 flex flex-col items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground mb-2">{data.title}</h2>
        <p className="text-foreground text-center leading-relaxed">{data.description}</p>
        <Link
          href={data.cta_link || "/about"}
          prefetch
          className="mt-4 px-6 py-2 rounded brand-btn-primary font-normal transition shadow"
        >
          {data.cta_text || "En savoir plus"}
        </Link>
      </div>
    </section>
  );
}
