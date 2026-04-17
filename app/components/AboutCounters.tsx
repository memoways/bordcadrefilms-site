import { readBCFNumbers } from "../lib/home";

export default async function AboutCounters() {
  const { numbers } = await readBCFNumbers();

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