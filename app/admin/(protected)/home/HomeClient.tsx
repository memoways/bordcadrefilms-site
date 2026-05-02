"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AdminField from "../../components/AdminField";
import AdminToast from "../../components/AdminToast";
import { adminPatch, adminPost, adminDelete, adminRevalidate } from "../../lib/api";

export type SiteConfigRow = {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_link: string;
};

export type HeroRow = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
};

export type BCFNumber = {
  id: string;
  number: string;
  label: string;
  description: string;
  order: string;
  public: boolean;
};

export function HomeClient({
  hero: initialHero,
  homeAbout: initial,
  numbers: initialNumbers,
}: {
  hero: HeroRow | null;
  homeAbout: SiteConfigRow | null;
  numbers: BCFNumber[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  // ── Hero section ───────────────────────────────────────────────────────────
  const [hero, setHero] = useState<HeroRow>(
    initialHero ?? {
      id: "",
      title: "",
      subtitle: "",
      description: "",
      videoUrl: "",
      posterUrl: "",
      cta1Text: "",
      cta1Link: "",
      cta2Text: "",
      cta2Link: "",
    },
  );
  const [savingHero, setSavingHero] = useState(false);

  async function saveHero() {
    setSavingHero(true);
    try {
      const fields = {
        section: "hero",
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        video_url: hero.videoUrl,
        poster_url: hero.posterUrl,
        cta1_text: hero.cta1Text,
        cta1_link: hero.cta1Link,
        cta2_text: hero.cta2Text,
        cta2_link: hero.cta2Link,
      };
      if (hero.id) {
        await adminPatch("SiteConfig", hero.id, fields);
      } else {
        const res = (await adminPost("SiteConfig", fields)) as { id: string };
        setHero((h) => ({ ...h, id: res.id }));
      }
      await adminRevalidate("site-config");
      router.refresh();
      setToast({ msg: "Hero saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingHero(false);
    }
  }

  // ── About section ──────────────────────────────────────────────────────────
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

  // ── BCF Numbers ────────────────────────────────────────────────────────────
  const [numbers, setNumbers] = useState<BCFNumber[]>(initialNumbers);
  const [savingAll, setSavingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function addNumber() {
    const tempId = `new-${Date.now()}`;
    setNumbers((prev) => [
      ...prev,
      { id: tempId, number: "0", label: "", description: "", order: String(prev.length + 1), public: false },
    ]);
  }

  function updateNum(id: string, key: keyof BCFNumber, val: string | number | boolean) {
    setNumbers((prev) => prev.map((n) => (n.id === id ? { ...n, [key]: val } : n)));
  }

  async function saveAllNumbers() {
    setSavingAll(true);
    try {
      const newIds: Array<{ tempId: string; realId: string }> = [];

      await Promise.all(
        numbers.map(async (num) => {
          const fields = {
            number: Number(num.number) || 0,
            label: num.label,
            description: num.description,
            order: Number(num.order) || 0,
            publish: Boolean(num.public),
          };
          if (num.id.startsWith("new-")) {
            const res = (await adminPost("BCFNumbers", fields)) as { id: string };
            newIds.push({ tempId: num.id, realId: res.id });
          } else {
            await adminPatch("BCFNumbers", num.id, fields);
          }
        }),
      );

      if (newIds.length > 0) {
        setNumbers((prev) =>
          prev.map((n) => {
            const match = newIds.find((u) => u.tempId === n.id);
            return match ? { ...n, id: match.realId } : n;
          }),
        );
      }

      await adminRevalidate("bcf-numbers");
      setToast({ msg: "All numbers saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingAll(false);
    }
  }

  async function deleteNumber(num: BCFNumber) {
    if (num.id.startsWith("new-")) {
      setNumbers((prev) => prev.filter((n) => n.id !== num.id));
      return;
    }
    setDeletingId(num.id);
    try {
      await adminDelete("BCFNumbers", num.id);
      setNumbers((prev) => prev.filter((n) => n.id !== num.id));
      await adminRevalidate("bcf-numbers");
      setToast({ msg: "Number deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete", type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Home Page</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Edit the hero, &quot;About&quot; section, and BCF stat counters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left Column: Hero & About */}
        <div className="space-y-8">
          {/* Hero section */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Hero Section
              </h2>
              <button
                onClick={saveHero}
                disabled={savingHero}
                className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {savingHero ? "Saving…" : "Save Hero"}
              </button>
            </div>
            <AdminField label="Title" value={hero.title} onChange={(v) => setHero((h) => ({ ...h, title: v }))} />
            <AdminField label="Subtitle" value={hero.subtitle} onChange={(v) => setHero((h) => ({ ...h, subtitle: v }))} />
            <AdminField label="Description" value={hero.description} onChange={(v) => setHero((h) => ({ ...h, description: v }))} multiline rows={4} />
            <AdminField label="Video URL" value={hero.videoUrl} onChange={(v) => setHero((h) => ({ ...h, videoUrl: v }))} placeholder="https://…/hero.mp4" />
            <AdminField label="Poster URL" value={hero.posterUrl} onChange={(v) => setHero((h) => ({ ...h, posterUrl: v }))} placeholder="https://…/poster.jpg" />
            <div className="grid grid-cols-2 gap-4">
              <AdminField label="Button 1 text" value={hero.cta1Text} onChange={(v) => setHero((h) => ({ ...h, cta1Text: v }))} placeholder="View films" />
              <AdminField label="Button 1 link" value={hero.cta1Link} onChange={(v) => setHero((h) => ({ ...h, cta1Link: v }))} placeholder="/films" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminField label="Button 2 text" value={hero.cta2Text} onChange={(v) => setHero((h) => ({ ...h, cta2Text: v }))} placeholder="Directors" />
              <AdminField label="Button 2 link" value={hero.cta2Link} onChange={(v) => setHero((h) => ({ ...h, cta2Link: v }))} placeholder="/directors" />
            </div>
          </div>

          {/* About section */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                About Section
              </h2>
              <button
                onClick={saveAbout}
                disabled={savingAbout}
                className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {savingAbout ? "Saving…" : "Save About"}
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
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-8">
          {/* Stats counters */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Stats Counters
              </h2>
              <button
                onClick={saveAllNumbers}
                disabled={savingAll || numbers.length === 0}
                className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {savingAll ? "Saving…" : "Save All Numbers"}
              </button>
            </div>

            {numbers.length === 0 && (
              <div className="text-center py-12 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl">
                No BCFNumbers records found.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {numbers.map((num) => (
                <div key={num.id} className={`flex gap-3 items-end border rounded-xl p-4 transition-all shadow-xs ${num.public ? "border-zinc-100 bg-white" : "border-orange-100 bg-orange-50/20"}`}>
                  <div className="w-20 shrink-0">
                    <AdminField label="Value" value={num.number} onChange={(v) => updateNum(num.id, "number", v)} type="number" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <AdminField label="Label" value={num.label} onChange={(v) => updateNum(num.id, "label", v)} placeholder="Films produced" />
                  </div>
                  <div className="w-12 shrink-0">
                    <AdminField label="Order" value={num.order} onChange={(v) => updateNum(num.id, "order", v)} type="number" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5 mb-0.5 shrink-0 px-1">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Public</span>
                    <input
                      type="checkbox"
                      checked={num.public}
                      onChange={(e) => updateNum(num.id, "public", e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    />
                  </div>
                  <button
                    onClick={() => deleteNumber(num)}
                    disabled={deletingId === num.id || savingAll}
                    className="px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    {deletingId === num.id ? "…" : "✕"}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addNumber}
              disabled={savingAll}
              className="mt-6 w-full py-3 text-sm font-medium border-2 border-dashed border-zinc-200 text-zinc-400 rounded-xl hover:border-zinc-300 hover:text-zinc-600 hover:bg-zinc-50/50 transition-all flex items-center justify-center gap-2"
            >
              <span>+</span> Add stat row
            </button>
          </div>
        </div>
      </div>

      <AdminToast message={toast?.msg ?? null} type={toast?.type} onDismiss={dismiss} />
    </div>
  );
}
