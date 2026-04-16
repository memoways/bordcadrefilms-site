"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AdminField from "../../components/AdminField";
import AdminToast from "../../components/AdminToast";
import { adminPatch, adminPost, adminRevalidate } from "../../lib/api";

export type SiteConfigRow = {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_link: string;
};

export type BCFNumber = {
  id: string;
  number: string;
  label: string;
  description: string;
  order: string;
};

export function HomeClient({
  homeAbout: initial,
  numbers: initialNumbers,
}: {
  homeAbout: SiteConfigRow | null;
  numbers: BCFNumber[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  const [about, setAbout] = useState<SiteConfigRow>(
    initial ?? { id: "", section: "home_about", title: "", subtitle: "", description: "", cta_text: "", cta_link: "" },
  );
  const [savingAbout, setSavingAbout] = useState(false);

  async function saveAbout() {
    setSavingAbout(true);
    try {
      const fields = {
        section: "home_about",
        title: about.title,
        subtitle: about.subtitle,
        description: about.description,
        cta_text: about.cta_text,
        cta_link: about.cta_link,
      };
      if (about.id) {
        await adminPatch("SiteConfig", about.id, fields);
      } else {
        const res = (await adminPost("SiteConfig", fields)) as { id: string };
        setAbout((a) => ({ ...a, id: res.id }));
      }
      await adminRevalidate("site-config");
      router.refresh();
      setToast({ msg: "Home section saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingAbout(false);
    }
  }

  const [numbers, setNumbers] = useState<BCFNumber[]>(initialNumbers);
  const [savingNum, setSavingNum] = useState<string | null>(null);

  function updateNum(id: string, key: keyof BCFNumber, val: string) {
    setNumbers((prev) => prev.map((n) => (n.id === id ? { ...n, [key]: val } : n)));
  }

  async function saveNumber(num: BCFNumber) {
    setSavingNum(num.id);
    try {
      await adminPatch("BCFNumbers", num.id, {
        number: Number(num.number) || 0,
        label: num.label,
        description: num.description,
        order: Number(num.order) || 0,
      });
      await adminRevalidate("bcf-numbers");
      setToast({ msg: "Number saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingNum(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Home Page</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Edit the homepage &quot;About&quot; section and BCF stat counters.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">About Section</h2>
          <button
            onClick={saveAbout}
            disabled={savingAbout}
            className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {savingAbout ? "Saving…" : "Save"}
          </button>
        </div>
        <AdminField label="Title" value={about.title} onChange={(v) => setAbout((a) => ({ ...a, title: v }))} />
        <AdminField label="Subtitle" value={about.subtitle} onChange={(v) => setAbout((a) => ({ ...a, subtitle: v }))} />
        <AdminField label="Description" value={about.description} onChange={(v) => setAbout((a) => ({ ...a, description: v }))} multiline rows={5} />
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="CTA text" value={about.cta_text} onChange={(v) => setAbout((a) => ({ ...a, cta_text: v }))} placeholder="Learn more" />
          <AdminField label="CTA link" value={about.cta_link} onChange={(v) => setAbout((a) => ({ ...a, cta_link: v }))} placeholder="/about" />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="font-semibold text-zinc-800 mb-5">Stats Counters</h2>
        {numbers.length === 0 && (
          <p className="text-sm text-zinc-400">No BCFNumbers records found in Airtable.</p>
        )}
        <div className="space-y-4">
          {numbers.map((num) => (
            <div key={num.id} className="flex gap-4 items-end border border-zinc-100 rounded-lg p-4">
              <div className="w-20 shrink-0">
                <AdminField label="Value" value={num.number} onChange={(v) => updateNum(num.id, "number", v)} type="number" />
              </div>
              <div className="flex-1">
                <AdminField label="Label" value={num.label} onChange={(v) => updateNum(num.id, "label", v)} placeholder="Films produced" />
              </div>
              <div className="w-12 shrink-0">
                <AdminField label="Order" value={num.order} onChange={(v) => updateNum(num.id, "order", v)} type="number" />
              </div>
              <button
                onClick={() => saveNumber(num)}
                disabled={savingNum === num.id}
                className="px-3 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {savingNum === num.id ? "…" : "Save"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AdminToast message={toast?.msg ?? null} type={toast?.type} onDismiss={dismiss} />
    </div>
  );
}
