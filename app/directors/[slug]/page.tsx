import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SmartImage from "../../components/SmartImage";
import { fetchAirtableRecords, type AirtableRecord } from "../../lib/airtable";
import { getValidImageUrl, slugify } from "../../lib/utils";

export const revalidate = 900;

type DirectorDetail = {
	slug: string;
	name: string;
	bio?: string;
	profilePicture?: string;
	origin?: string;
	films: Array<{ slug: string; originalTitle: string; englishTitle?: string }>;
};

const PRIMARY_MOVIE_FIELDS = [
	"title",
	"Movie title",
	"Original Title",
	"Director (Lookup)",
	"Director (People Table)",
	"Director",
	"Director Bio EN",
	"Director Bio FR",
	"bio",
	"Director profile picture",
	"Origine_FR (from People) (from Credits)",
];

const MIRROR_MOVIE_FIELDS = [
	"Movie title",
	"Original Title",
	"Director",
	"Director from credits",
	"Director Bio EN",
	"Director Bio FR",
	"Profile pictures",
	"Origine_FR (from People) (from Credits)",
];

function fieldText(value: unknown): string | undefined {
	if (typeof value === "string") return value.trim() || undefined;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		for (const item of value) {
			const text = fieldText(item);
			if (text) return text;
		}
	}
	if (typeof value === "object" && value !== null) {
		const record = value as { name?: unknown; value?: unknown; text?: unknown; title?: unknown };
		return fieldText(record.name ?? record.value ?? record.text ?? record.title);
	}
	return undefined;
}

function firstField(fields: Record<string, unknown>, names: string[]): string | undefined {
	for (const name of names) {
		const value = fieldText(fields[name]);
		if (value) return value;
	}
	return undefined;
}

function imageField(fields: Record<string, unknown>, names: string[]): string | undefined {
	for (const name of names) {
		const value = getValidImageUrl(fields[name]);
		if (value) return value;
	}
	return undefined;
}

function parseOrigin(country?: string): string | undefined {
	if (!country) return undefined;
	const parts = country
		.split(/[|,/]/g)
		.map((part) => part.trim())
		.filter(Boolean);
	return parts[0] || undefined;
}

async function getDirectorMovieRecords(): Promise<AirtableRecord[]> {
	const cmsBaseId = process.env.AIRTABLE_CMS_BASE_ID;

	if (cmsBaseId) {
		try {
			return await fetchAirtableRecords("Sync - Movie", MIRROR_MOVIE_FIELDS, null, {
				baseId: cmsBaseId,
			});
		} catch (error) {
			console.error("[Airtable] Sync - Movie director fetch failed, falling back to primary movie table:", error);
		}
	}

	return fetchAirtableRecords(process.env.AIRTABLE_TABLE_NAME!, PRIMARY_MOVIE_FIELDS);
}

function directorNameFromRecord(record: AirtableRecord): string | undefined {
	return firstField(record.fields, [
		"Director",
		"Director (Lookup)",
		"Director (People Table)",
		"Director from credits",
	]);
}

function filmFromRecord(record: AirtableRecord, fallbackIndex: number) {
	const englishTitle = firstField(record.fields, ["Movie title", "title"]);
	const originalTitle = firstField(record.fields, ["Original Title"]) || englishTitle || `Film ${fallbackIndex + 1}`;

	return {
		slug: slugify(englishTitle || originalTitle) || `film-${fallbackIndex}`,
		originalTitle,
		englishTitle: englishTitle && englishTitle !== originalTitle ? englishTitle : undefined,
	};
}

async function getDirectorBySlug(slug: string): Promise<DirectorDetail | undefined> {
	const records = await getDirectorMovieRecords();

	const relatedRecords = records.filter((record) => {
		const directorName = directorNameFromRecord(record)?.trim();
		return directorName ? slugify(directorName) === slug : false;
	});

	if (relatedRecords.length === 0) return undefined;

	const primary = relatedRecords[0];
	const name = directorNameFromRecord(primary)?.trim() || "";

	if (!name) return undefined;

	const films = relatedRecords
		.map((record, index) => filmFromRecord(record, index))
		.sort((a, b) => a.originalTitle.localeCompare(b.originalTitle));

	return {
		slug,
		name,
		bio: firstField(primary.fields, ["Director Bio EN", "bio", "Director Bio FR"]),
		profilePicture: imageField(primary.fields, ["Profile pictures", "Director profile picture"]),
		origin: parseOrigin(firstField(primary.fields, ["Origine_FR (from People) (from Credits)"])),
		films,
	};
}

export async function generateStaticParams() {
	const records = await getDirectorMovieRecords();
	const unique = new Map<string, string>();

	for (const record of records) {
		const name = directorNameFromRecord(record)?.trim();
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
		title: director ? `${director.name} — Bord Cadre Films` : "Director — Bord Cadre Films",
		description: director?.bio || "Director profile — Bord Cadre Films",
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

	return (
		<main className="min-h-screen bg-zinc-50 text-zinc-900">
			<section className="bg-[#1C1C1C] text-white">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-8 lg:py-12">
					<div className="grid items-center gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
						<div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full border border-white/85 bg-zinc-800 sm:h-44 sm:w-44 lg:mx-0">
							{director.profilePicture ? (
								<SmartImage
									src={director.profilePicture}
									alt={director.name}
									fill
									className="object-cover"
									sizes="(max-width: 1023px) 176px, 220px"
									priority
									skeletonClassName="bg-zinc-800"
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
										<span className="font-medium text-white">Origin:</span> {director.origin}
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

			<section className="bg-[#DEDEDE]">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-8 lg:py-12">
					<div className="rounded-2xl bg-[#F4F4F4] p-5 sm:p-6 md:p-8">
						<h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-zinc-900">
							<span className="inline-block h-0.5 w-6 bg-[#E0A75D]" />
							All movies of this director
						</h2>
						<ul className="space-y-2 text-sm text-zinc-700">
							{director.films.map((film) => (
								<li key={film.slug}>
									<Link href={`/films/${film.slug}`} className="font-medium text-zinc-900 hover:underline">
										{film.originalTitle}
										{film.englishTitle ? ` (${film.englishTitle})` : ""}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>
		</main>
	);
}
