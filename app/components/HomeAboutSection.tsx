import Link from "next/link";

type HomeAboutFromAPI = {
  title: string;
  subtitle?: string;
  description: string;
  cta_text?: string;
  cta_link?: string;
  background_image?: string;
  source: string;
};

const fallbackAbout: HomeAboutFromAPI = {
  title: "About",
  subtitle: "Bord Cadre Films",
  description:
    "Bord Cadre Films is an independent Swiss production company specializing in the development, financing, and production of international feature films. Its editorial line is distinguished by its strong cultural diversity and social awareness.",
  cta_text: "More informations",
  cta_link: "/about",
  source: "fallback",
};

export default async function HomeAboutSection() {
  let data: HomeAboutFromAPI = fallbackAbout;

  try {
    const res = await fetch(new URL("/api/home-about", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000").toString(), {
      next: { revalidate: 3600, tags: ["home-about"] },
    });

    if (res.ok) {
      const json = (await res.json()) as {
        ok: boolean;
        data?: HomeAboutFromAPI;
      };
      if (json.ok && json.data) {
        data = json.data;
      }
    }
  } catch (error) {
    console.error("[HomeAboutSection] Error:", error);
  }

  return (
    <section className="w-full flex justify-center py-16 px-4 bg-white text-zinc-900">
      <div className="max-w-3xl w-full  rounded-2xl p-8 flex flex-col items-center gap-4 ">
        <h2 className="text-3xl font-bold text-[#1C1C1C] mb-2">{data.title}</h2>
        <p className="text-[#1C1C1C] text-center leading-relaxed">{data.description}</p>
        <Link href={data.cta_link || "/about"} prefetch className="mt-4 px-6 py-2 rounded brand-btn-primary font-semibold transition shadow">
          {data.cta_text || "More informations"}
        </Link>
      </div>
    </section>
  );
}
