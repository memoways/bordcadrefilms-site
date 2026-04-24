"use client";

import dynamic from "next/dynamic";
import type { NewsRow } from "./NewsClient";

const NewsClient = dynamic<{
  initialItems: NewsRow[];
  table: string;
}>(
  () => import("./NewsClient").then((mod) => mod.NewsClient),
  {
    ssr: false,
    loading: () => (
      <div className="text-sm text-zinc-500">Loading news editor…</div>
    ),
  },
);

export default function NewsClientLoader({
  initialItems,
  table,
}: {
  initialItems: NewsRow[];
  table: string;
}) {
  return <NewsClient initialItems={initialItems} table={table} />;
}
