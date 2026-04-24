"use client";

import { useCallback, useState } from "react";
import AdminField from "../../components/AdminField";
import AdminToast from "../../components/AdminToast";
import { adminPatch, adminPost, adminDelete, adminRevalidate } from "../../lib/api";
import { slugify } from "../../../lib/utils";

const STATUS_OPTIONS = [
  "Currently shooting",
  "In post-production",
  "Festival premiere",
] as const;

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  director: string;
  excerpt: string;
  content: string;
  status: string;
  location: string;
  publishedAt: string;
  link: string;
  imageUrl: string;
  order: number;
};

function SortableRow({
  item,
  expanded,
  onExpand,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  item: NewsRow;
  expanded: boolean;
  onExpand: () => void;
  onSave: (m: NewsRow) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  deleting: boolean;
}) {
  const [draft, setDraft] = useState<NewsRow>(item);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{item.title || "Untitled"}</p>
          <p className="text-xs text-zinc-400 truncate">
            {item.status}{item.director ? ` · ${item.director}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onExpand}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors"
        >
          {expanded ? "Close" : "Edit"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="text-xs px-2 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-4 space-y-4 bg-zinc-50">
          <AdminField
            label="Title"
            value={draft.title}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                title: v,
                // Auto-fill slug if empty or still matches previous auto-slug
                slug:
                  d.slug === "" || d.slug === slugify(d.title) ? slugify(v) : d.slug,
              }))
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminField
              label="Slug (URL)"
              value={draft.slug}
              onChange={(v) => setDraft((d) => ({ ...d, slug: slugify(v) }))}
              placeholder="e.g. festival-premiere-2026"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Status
              </label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminField
              label="Director"
              value={draft.director}
              onChange={(v) => setDraft((d) => ({ ...d, director: v }))}
            />
            <AdminField
              label="Location"
              value={draft.location}
              onChange={(v) => setDraft((d) => ({ ...d, location: v }))}
              placeholder="e.g. Cannes, France"
            />
          </div>
          <AdminField
            label="Excerpt (shown on card)"
            value={draft.excerpt}
            onChange={(v) => setDraft((d) => ({ ...d, excerpt: v }))}
            multiline
            rows={2}
          />
          <AdminField
            label="Content — full article (blank line = new paragraph)"
            value={draft.content}
            onChange={(v) => setDraft((d) => ({ ...d, content: v }))}
            multiline
            rows={6}
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminField
              label="Published date"
              value={draft.publishedAt}
              onChange={(v) => setDraft((d) => ({ ...d, publishedAt: v }))}
              placeholder="2026-04-24"
            />
            <AdminField
              label="External link (optional)"
              value={draft.link}
              onChange={(v) => setDraft((d) => ({ ...d, link: v }))}
              placeholder="https://…"
            />
          </div>
          <AdminField
            label="Image URL (Airtable attachment URL)"
            value={draft.imageUrl}
            onChange={(v) => setDraft((d) => ({ ...d, imageUrl: v }))}
            placeholder="https://v5.airtableusercontent.com/…"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NewsClient({ initialItems, table }: { initialItems: NewsRow[]; table: string }) {
  const [items, setItems] = useState<NewsRow[]>(initialItems);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  function buildFields(row: NewsRow) {
    const fields: Record<string, unknown> = {
      slug: row.slug || slugify(row.title),
      title: row.title,
      director: row.director,
      excerpt: row.excerpt,
      content: row.content,
      status: row.status,
      location: row.location,
      publishedAt: row.publishedAt,
      link: row.link,
      order: row.order,
    };

    if (row.imageUrl) {
      fields.image = [{ url: row.imageUrl }];
    }

    return fields;
  }

  async function saveItem(row: NewsRow) {
    if (!row.title.trim()) {
      setToast({ msg: "Title is required", type: "error" });
      return;
    }
    setSaving(row.id);
    try {
      await adminPatch(table, row.id, buildFields(row));
      await adminRevalidate("news");
      setItems((prev) => prev.map((m) => (m.id === row.id ? row : m)));
      setToast({ msg: "News saved", type: "success" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setToast({ msg: `Failed to save: ${msg}`, type: "error" });
    } finally {
      setSaving(null);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this news item? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await adminDelete(table, id);
      await adminRevalidate("news");
      setItems((prev) => prev.filter((m) => m.id !== id));
      if (expanded === id) setExpanded(null);
      setToast({ msg: "News deleted", type: "success" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setToast({ msg: `Failed to delete: ${msg}`, type: "error" });
    } finally {
      setDeleting(null);
    }
  }

  async function addItem() {
    setAdding(true);
    try {
      const newOrder = items.length + 1;
      const title = "New update";
      const slug = `new-update-${Date.now()}`;
      const placeholderImage = "https://placehold.co/1200x800?text=News+image";
      const result = (await adminPost(table, {
        title,
        slug,
        status: "Currently shooting",
        order: newOrder,
        excerpt: "Draft news item — update this text.",
        publishedAt: new Date().toISOString().slice(0, 10),
        image: [{ url: placeholderImage }],
      })) as { id: string };
      const newRow: NewsRow = {
        id: result.id,
        slug,
        title,
        director: "",
        excerpt: "Draft news item — update this text.",
        content: "",
        status: "Currently shooting",
        location: "",
        publishedAt: new Date().toISOString().slice(0, 10),
        link: "",
        imageUrl: placeholderImage,
        order: newOrder,
      };
      setItems((prev) => [...prev, newRow]);
      await adminRevalidate("news");
      setExpanded(result.id);
      setToast({ msg: "Draft created — fill in the details", type: "success" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setToast({ msg: `Failed to add news item: ${msg}`, type: "error" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">News</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create updates, press coverage and festival announcements. Drag to reorder. Click Publish after editing.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={adding}
          className="shrink-0 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {adding ? "Adding…" : "+ Add news"}
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl">
          No news items yet. Click &quot;Add news&quot; to create your first update.
        </div>
      )}

      <div className="space-y-2">
        {items.map((m) => (
          <SortableRow
            key={m.id}
            item={m}
            expanded={expanded === m.id}
            onExpand={() => setExpanded((e) => (e === m.id ? null : m.id))}
            onSave={saveItem}
            onDelete={deleteItem}
            saving={saving === m.id}
            deleting={deleting === m.id}
          />
        ))}
      </div>

      <AdminToast message={toast?.msg ?? null} type={toast?.type} onDismiss={dismiss} />
    </div>
  );
}
