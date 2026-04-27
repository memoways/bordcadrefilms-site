"use client";

import { useState } from "react";
import { safeExternalUrl } from "../lib/utils";
import type { PressArticle } from "@/app/lib/airtable";

const INITIAL_VISIBLE = 5;

type FilmPressProps = {
  articles: PressArticle[];
  pressKitUrl?: string;
};

export default function FilmPress({ articles, pressKitUrl }: FilmPressProps) {
  const [showAll, setShowAll] = useState(false);
  const safeKit = safeExternalUrl(pressKitUrl);
  if (!safeKit && articles.length === 0) return null;

  const visible = showAll ? articles : articles.slice(0, INITIAL_VISIBLE);
  const hidden = articles.length - INITIAL_VISIBLE;
  const hasMore = hidden > 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
      {safeKit && (
        <a
          href={safeKit}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#E0A75D] px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-[#d29748]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Press kit
        </a>
      )}

      {visible.length > 0 && (
        <ul className="w-full space-y-2 text-sm text-zinc-700">
          {visible.map((article, idx) => {
            const safeArticleUrl = safeExternalUrl(article.url);
            const sourceTag = article.source ? (
              <span className="ml-1 text-zinc-500">— {article.source}</span>
            ) : null;
            return (
              <li key={`${article.title}-${idx}`} className="flex gap-2 leading-relaxed">
                <span className="shrink-0 select-none text-[#E0A75D]" aria-hidden>·</span>
                <span className="min-w-0">
                  {safeArticleUrl ? (
                    <a
                      href={safeArticleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E0A75D] underline underline-offset-2 hover:text-[#c89554]"
                    >
                      {article.title}
                    </a>
                  ) : (
                    <span>{article.title}</span>
                  )}
                  {sourceTag}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="text-sm font-semibold text-[#E0A75D] underline-offset-2 hover:underline"
        >
          {showAll ? "Show less" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  );
}
