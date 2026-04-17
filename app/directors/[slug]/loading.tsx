export default function Loading() {
	return (
		<main className="min-h-screen bg-zinc-50">
			<section className="bg-[#1C1C1C]">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-8 lg:py-12 animate-pulse">
					<div className="grid items-center gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
						<div className="mx-auto h-40 w-40 rounded-full border border-zinc-500 bg-zinc-700 sm:h-44 sm:w-44 lg:mx-0" />
						<div className="space-y-4">
							<div className="h-12 w-3/4 rounded bg-zinc-700" />
							<div className="h-6 w-40 rounded bg-zinc-700" />
							<div className="h-20 w-full rounded bg-zinc-700" />
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
