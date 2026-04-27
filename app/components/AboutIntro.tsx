type Props = {
  description: string;
};

export default function AboutIntro({ description }: Props) {
  const paragraphs = description
    .split(/\n\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-20 bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-light text-zinc-900 tracking-tight mb-10 md:mb-16">
          About
        </h1>
        <div className="max-w-4xl space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base  text-zinc-800 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
