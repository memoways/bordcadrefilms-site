import Link from "next/link";
import { getDirectors, type Director } from "../lib/catalog";
import DirectorGrid from "./DirectorGrid";

export default async function HomeDirectorsPreview() {
  const directors: Director[] = await getDirectors();

  return (
    <section className="w-full py-12 md:py-20 bg-white text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-zinc-900">Directors</h2>
        <DirectorGrid directors={directors} limit={4} />
        <div className="flex justify-center mt-4">
          <Link href="/directors" prefetch className="px-6 py-2 rounded brand-btn-secondary font-normal transition">
            View all directors
          </Link>
        </div>
      </div>
    </section>
  );
}
