"use client";

import { useState } from "react";

type PublishButtonProps = {
  tag: string;
  label: string;
  path: string;
};

export default function PublishButton({ tag, label, path }: PublishButtonProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message = payload?.error || payload?.message || res.statusText;
        throw new Error(message ?? "Unknown error");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "submitting"}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-left"
      >
        <div>
          <span className="text-sm font-medium text-zinc-800">{label}</span>
          <span className="text-xs text-zinc-400 ml-2">{path}</span>
        </div>
        <span className="text-xs text-zinc-500">
          {status === "submitting" ? "Publishing…" : status === "success" ? "Published" : "Publish →"}
        </span>
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-500">Failed: {error}</p>
      ) : null}
    </div>
  );
}
