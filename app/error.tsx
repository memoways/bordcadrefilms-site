"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-zinc-900">Something went wrong</h1>
      <p className="max-w-md text-zinc-600">
        Content could not be loaded. Please try again or return to the home page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-normal text-white transition-colors hover:bg-zinc-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-normal text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
