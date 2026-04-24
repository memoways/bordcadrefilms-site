"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminField from "../../components/AdminField";
import AdminToast from "../../components/AdminToast";
import SocialIcon from "../../../components/SocialIcon";
import type { SocialPlatform } from "../../../lib/social";
import { adminPatch, adminPost, adminDelete, adminRevalidate } from "../../lib/api";

const TABLE = "SocialMedia";

const PLATFORM_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "X / Twitter" },
  { value: "vimeo", label: "Vimeo" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

function platformLabel(p: string): string {
  return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

export type SocialRow = {
  id: string;
  label: string;
  platform: string;
  url: string;
  order: number;
  publish: boolean;
};

function SortableRow({
  item,
  expanded,
  onExpand,
  onSave,
  onDelete,
  onTogglePublish,
  saving,
  deleting,
}: {
  item: SocialRow;
  expanded: boolean;
  onExpand: () => void;
  onSave: (m: SocialRow) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (row: SocialRow) => void;
  saving: boolean;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const [draft, setDraft] = useState<SocialRow>(item);
  const displayLabel = item.label || platformLabel(item.platform);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white border border-zinc-200 rounded-xl overflow-hidden transition-shadow ${isDragging ? "shadow-2xl opacity-80 z-50" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        <div className="w-8 h-8 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
          <SocialIcon platform={(item.platform as SocialPlatform) || "other"} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{displayLabel}</p>
          <p className="text-xs text-zinc-400 truncate">{item.url || "— no URL set"}</p>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={item.publish}
            onChange={() => onTogglePublish(item)}
            className="w-4 h-4 accent-zinc-900"
          />
          <span>{item.publish ? "Visible" : "Hidden"}</span>
        </label>

        <button
          onClick={onExpand}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors"
        >
          {expanded ? "Close" : "Edit"}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="text-xs px-2 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-4 space-y-4 bg-zinc-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Platform
              </label>
              <select
                value={draft.platform}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    platform: e.target.value,
                    label: d.label || platformLabel(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white"
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <AdminField
              label="Label (shown as aria-label)"
              value={draft.label}
              onChange={(v) => setDraft((d) => ({ ...d, label: v }))}
              placeholder="e.g. YouTube, Our LinkedIn"
            />
          </div>
          <AdminField
            label="URL"
            value={draft.url}
            onChange={(v) => setDraft((d) => ({ ...d, url: v }))}
            placeholder="https://instagram.com/bordcadrefilms"
          />
          <div className="flex justify-end">
            <button
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

export function SocialClient({ initialItems }: { initialItems: SocialRow[] }) {
  const [items, setItems] = useState<SocialRow[]>(initialItems);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = items.findIndex((m) => m.id === active.id);
    const newIdx = items.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx).map((m, i) => ({
      ...m,
      order: i + 1,
    }));
    setItems(reordered);

    try {
      await Promise.all(
        reordered.map((m) => adminPatch(TABLE, m.id, { order: m.order })),
      );
      await adminRevalidate("social-media");
      setToast({ msg: "Order saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save order", type: "error" });
    }
  }

  async function saveItem(row: SocialRow) {
    if (!row.url.trim()) {
      setToast({ msg: "URL is required", type: "error" });
      return;
    }
    setSaving(row.id);
    try {
      await adminPatch(TABLE, row.id, {
        label: row.label,
        platform: row.platform,
        url: row.url,
        order: row.order,
        publish: row.publish,
      });
      await adminRevalidate("social-media");
      setItems((prev) => prev.map((m) => (m.id === row.id ? row : m)));
      setToast({ msg: "Link saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSaving(null);
    }
  }

  async function togglePublish(row: SocialRow) {
    const next = { ...row, publish: !row.publish };
    setItems((prev) => prev.map((m) => (m.id === row.id ? next : m)));
    try {
      await adminPatch(TABLE, row.id, { publish: next.publish });
      await adminRevalidate("social-media");
      setToast({
        msg: next.publish ? "Link is now visible" : "Link hidden",
        type: "success",
      });
    } catch {
      // Revert on failure
      setItems((prev) => prev.map((m) => (m.id === row.id ? row : m)));
      setToast({ msg: "Failed to update visibility", type: "error" });
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this social link?")) return;
    setDeleting(id);
    try {
      await adminDelete(TABLE, id);
      await adminRevalidate("social-media");
      setItems((prev) => prev.filter((m) => m.id !== id));
      if (expanded === id) setExpanded(null);
      setToast({ msg: "Link deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete", type: "error" });
    } finally {
      setDeleting(null);
    }
  }

  async function addItem() {
    setAdding(true);
    try {
      const newOrder = items.length + 1;
      const result = (await adminPost(TABLE, {
        label: "Instagram",
        platform: "instagram",
        url: "",
        order: newOrder,
        publish: false,
      })) as { id: string };
      const newRow: SocialRow = {
        id: result.id,
        label: "Instagram",
        platform: "instagram",
        url: "",
        order: newOrder,
        publish: false,
      };
      setItems((prev) => [...prev, newRow]);
      setExpanded(result.id);
      setToast({ msg: "Link added — fill in the URL then publish", type: "success" });
    } catch {
      setToast({ msg: "Failed to add link", type: "error" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Social media</h1>
          <p className="text-sm text-zinc-500 mt-1">
            These links appear in the footer of every page. Drag to reorder, toggle visibility per row, and click Publish to push changes live.
          </p>
        </div>
        <button
          onClick={addItem}
          disabled={adding}
          className="shrink-0 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {adding ? "Adding…" : "+ Add link"}
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl">
          No social links yet. Click &quot;Add link&quot; to add one.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((m) => (
              <SortableRow
                key={m.id}
                item={m}
                expanded={expanded === m.id}
                onExpand={() => setExpanded((e) => (e === m.id ? null : m.id))}
                onSave={saveItem}
                onDelete={deleteItem}
                onTogglePublish={togglePublish}
                saving={saving === m.id}
                deleting={deleting === m.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AdminToast message={toast?.msg ?? null} type={toast?.type} onDismiss={dismiss} />
    </div>
  );
}
