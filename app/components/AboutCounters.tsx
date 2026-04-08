import Image from "next/image";

type CounterNumber = {
  number: number;
  label: string;
  description?: string;
  order: number;
};

type BCFNumbersFromAPI = {
  numbers: CounterNumber[];
  source: string;
};

const fallbackNumbers: CounterNumber[] = [
  { number: 15, label: "films produits", description: "Films complétés", order: 1 },
  { number: 8, label: "réalisateurs", description: "Partenaires réguliers", order: 2 },
  { number: 1, label: "décade", description: "D'expérience", order: 3 },
];

export default async function AboutCounters() {
  let numbers: CounterNumber[] = fallbackNumbers;

  try {
    const res = await fetch(new URL("/api/bcf-numbers", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000").toString(), {
      next: { revalidate: 3600, tags: ["bcf-numbers"] },
    });

    if (res.ok) {
      const json = (await res.json()) as { ok: boolean; data?: BCFNumbersFromAPI };
      if (json.ok && json.data?.numbers?.length) {
        numbers = json.data.numbers.sort((a, b) => a.order - b.order);
      }
    }
  } catch (error) {
    console.error("[AboutCounters] Error:", error);
  }

  if (numbers.length === 0) return null;

  return (
    <section className="w-full py-16 px-4 bg-zinc-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {numbers.map((item) => (
          <div key={item.order} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white shadow-sm border border-zinc-200">
            <div className="text-5xl md:text-6xl font-bold text-zinc-900">{item.number}</div>
            <div className="text-lg font-semibold text-zinc-700">{item.label}</div>
            {item.description && <div className="text-sm text-zinc-500">{item.description}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}