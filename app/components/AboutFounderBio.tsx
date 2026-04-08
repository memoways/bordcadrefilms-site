import Image from "next/image";

type FounderBioFromAPI = {
  name: string;
  title?: string;
  bio: string;
  image?: string;
  source: string;
};

const fallbackBio: FounderBioFromAPI = {
  name: "Founder",
  title: "Founder & Director",
  bio: "Leading visionary filmmaker dedicated to supporting independent cinema and emerging directors from around the world.",
  source: "fallback",
};

export default async function AboutFounderBio() {
  let data: FounderBioFromAPI = fallbackBio;

  try {
    const res = await fetch(new URL("/api/about-bio", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000").toString(), {
      next: { revalidate: 86400, tags: ["about-bio"] },
    });

    if (res.ok) {
      const json = (await res.json()) as { ok: boolean; data?: FounderBioFromAPI };
      if (json.ok && json.data) {
        data = json.data;
      }
    }
  } catch (error) {
    console.error("[AboutFounderBio] Error:", error);
  }

  return (
    <section className="w-full py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {data.image && (
          <div className="relative h-96 rounded-3xl overflow-hidden shadow-lg border border-zinc-200">
            <Image src={data.image} alt={data.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        )}
        <div className="space-y-6">
          <h2 className="text-4xl font-semibold text-zinc-900">{data.name}</h2>
          {data.title && <p className="text-lg text-zinc-600 font-medium">{data.title}</p>}
          <p className="text-lg text-zinc-700 leading-relaxed">{data.bio}</p>
        </div>
      </div>
    </section>
  );
}