"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  type?: "success" | "error";
  onDismiss: () => void;
};

export default function AdminToast({
  message,
  type = "success",
  onDismiss,
}: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50 animate-in slide-in-from-bottom-2 duration-200 ${
        type === "success"
          ? "bg-zinc-900 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}
