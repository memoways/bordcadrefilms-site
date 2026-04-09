import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFilms } from "../../lib/catalog";
import { getValidImageUrl, slugify } from "../../lib/utils";

export const revalidate = 900;

type DirectorDetail = {
	slug: string;
	name: string;
	bio?: string;
	profilePicture?: string;
	origin?: string;
	films: Array<{ slug: string; title: string; year?: string; poster?: string }>;
};

function parseOrigin(country?: string): string | undefined {
	if (!country) return undefined;
	const parts = country
		.split(/[|,/]/g)
		.map((part) => part.trim())
		.filter(Boolean);
	return parts[0] || undefined;
}

async function getDirectorBySlug(slug: string): Promise<DirectorDetail | undefined> {
	const films = await getFilms();

	const relatedFilms = films.filter((film) => {
		const directorName = film.director?.trim();
		return directorName ? slugify(directorName) === slug : false;
	});

	if (relatedFilms.length === 0) return undefined;

	const primary = relatedFilms[0];
	const name = primary.director?.trim() || "";

	if (!name) return undefined;

	return {
		slug,
		name,
		bio: primary.bio,
		profilePicture: getValidImageUrl(primary.profilePicture),
		origin: parseOrigin(primary.country),
		films: relatedFilms
			.map((film) => ({
				slug: film.slug,
				title: film.title,
				year: film.year,
				poster: getValidImageUrl(film.poster) || getValidImageUrl(film.images?.[0]),
			}))
			.sort((a, b) => Number(b.year || 0) - Number(a.year || 0)),
	};
}

export async function generateStaticParams() {
	const films = await getFilms();
	const unique = new Map<string, string>();

	for (const film of films) {
		const name = film.director?.trim();
		if (!name) continue;
		const key = slugify(name);
		if (!unique.has(key)) unique.set(key, name);
	}

	return Array.from(unique.keys()).map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const director = await getDirectorBySlug(slug);

	return {
		title: director ? `${director.name} — Bord Cadre Films` : "Réalisateur — Bord Cadre Films",
		description: director?.bio || "Fiche réalisateur Bord Cadre Films",
	};
}

export default async function DirectorDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const director = await getDirectorBySlug(slug);

	if (!director) return notFound();

	const latestEntries = director.films.slice(0, 3).map((film) => ({
		...film,
		description: director.bio,
	}));

	return (
		<main className="min-h-screen bg-zinc-50 text-zinc-900">
			<section className="bg-[#1C1C1C] text-white">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-8 lg:py-12">
					<div className="grid items-center gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
						<div className="mx-auto h-40 w-40 overflow-hidden rounded-full border border-white/85 bg-zinc-800 sm:h-44 sm:w-44 lg:mx-0">
							{director.profilePicture ? (
								<Image
									src={director.profilePicture}
									alt={`Portrait de ${director.name}`}
									width={176}
									height={176}
									className="h-full w-full object-cover"
									sizes="(max-width: 1023px) 176px, 220px"
									priority
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-sm text-zinc-300">
									No image
								</div>
							)}
						</div>

						<div className="space-y-4">
							<div className="space-y-1">
								<h1 className="text-4xl font-light leading-tight md:text-5xl">{director.name}</h1>
								{director.origin && (
									<p className="text-lg text-zinc-300">
										<span className="font-medium text-white">Origine :</span> {director.origin}
									</p>
								)}
							</div>

							{director.bio && (
								<p className="max-w-4xl text-base font-bold leading-6 text-zinc-100">
									{director.bio}
								</p>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="bg-[#ECECEC]">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-8 lg:py-12">
					<div className="mb-8 text-center">
						<p className="text-base text-zinc-500">Dernières</p>
						<div className="mt-1 flex items-center justify-center gap-6">
							<span className="h-px w-24 bg-accent sm:w-40 lg:w-60" />
							<h2 className="text-4xl font-light text-zinc-900">Actualités</h2>
							<span className="h-px w-24 bg-accent sm:w-40 lg:w-60" />
						</div>
					</div>

					<div className="space-y-4">
						{latestEntries.map((entry) => (
							<article
								key={entry.slug}
								className="border-b border-zinc-300 pb-4 last:border-b-0 last:pb-0"
							>
								<Link
									href={`/completed-films/${entry.slug}`}
									className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start"
								>
									<div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-zinc-300 bg-zinc-900">
										{entry.poster ? (
											<Image
												src={entry.poster}
												alt={entry.title}
												fill
												className="object-cover"
												sizes="(max-width: 639px) 100vw, 190px"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-xs text-zinc-300">
												No image
											</div>
										)}
									</div>

									<div className="pt-1">
										<h3 className="text-3xl font-semibold leading-tight text-zinc-900">{entry.title}</h3>
										<p className="mt-1 line-clamp-2 text-base leading-snug text-zinc-800">
											{entry.description}
										</p>
										<p className="mt-2 text-sm text-zinc-500">Date de publication</p>
									</div>
								</Link>
							</article>
						))}
					</div>

					<div className="mt-8 flex justify-center">
						<Link
							href="/news"
							className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition brand-btn-primary"
						>
							Toutes les actualités
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
