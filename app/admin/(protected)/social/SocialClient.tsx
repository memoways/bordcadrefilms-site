"use client";

import { useCallback, useEffect, useState } from "react";
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
import type { SocialLink, SocialPlatform } from "../../../lib/social";
import { normalizePlatform, SOCIAL_TABLE } from "../../../lib/social";
import { adminPatch, adminPost, adminDelete, adminRevalidate } from "../../lib/api";

type SocialRow = SocialLink;

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

function platformLabel(p: SocialPlatform): string {
  return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

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
  const currentPlatform: SocialPlatform = expanded ? draft.platform : item.platform;
  const displayLabel = expanded
    ? draft.label || platformLabel(draft.platform)
    : item.label || platformLabel(item.platform);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
        isDragging ? "shadow-2xl opacity-80 z-50" : "shadow-xs"
      } ${
        expanded
          ? "col-span-full shadow-lg border-zinc-300 ring-1 ring-zinc-200"
          : "hover:shadow-md border-zinc-200"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 ${expanded ? "bg-zinc-50/50 border-b border-zinc-100" : ""}`}>
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 transition-colors"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200 shadow-xs">
          <SocialIcon platform={currentPlatform} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{displayLabel}</p>
          <p className="text-xs text-zinc-400 truncate font-medium">{item.url || "— no URL set"}</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={item.publish}
              onChange={() => onTogglePublish(item)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 transition-colors"
            />
            <span className="group-hover:text-zinc-700 transition-colors">{item.publish ? "Visible" : "Hidden"}</span>
          </label>

          <button
            onClick={onExpand}
            className={`text-xs px-4 py-1.5 rounded-lg border font-medium transition-all ${
              expanded
                ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {expanded ? "Close" : "Edit"}
          </button>
          
          <button
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            className="text-xs p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Delete link"
          >
            {deleting ? "…" : "✕"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 py-6 bg-white">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Platform
                  </label>
                  <select
                    value={draft.platform}
                    onChange={(e) => {
                      const next = normalizePlatform(e.target.value);
                      setDraft((d) => ({
                        ...d,
                        platform: next,
                        label: d.label || platformLabel(next),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white transition-all"
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
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <label className="flex items-center gap-3 text-sm font-semibold text-zinc-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draft.publish}
                    onChange={(e) => setDraft((d) => ({ ...d, publish: e.target.checked }))}
                    className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  />
                  <div>
                    <p>Publish this link</p>
                    <p className="text-xs text-zinc-500 font-normal mt-0.5">
                      Only published links appear in the website footer.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-8 border-t border-zinc-100">
            <button
              onClick={() => onSave(draft)}
              disabled={saving}
              className="px-6 py-2 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SocialClient({ initialItems }: { initialItems: SocialRow[] }) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<SocialRow[]>(initialItems);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!mounted) return <div className="p-8 text-zinc-400 animate-pulse">Loading links...</div>;

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
        reordered.map((m) => adminPatch(SOCIAL_TABLE, m.id, { order: m.order })),
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
      await adminPatch(SOCIAL_TABLE, row.id, {
        label: row.label,
        platform: row.platform,
        url: row.url,
        order: row.order,
        publish: row.publish,
      });
      await adminRevalidate("social-media");
      setItems((prev) => prev.map((m) => (m.id === row.id ? row : m)));
      setToast({
        msg: row.publish
          ? "Link saved"
          : "Link saved, but it is hidden until Publish is toggled on",
        type: "success",
      });
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
      await adminPatch(SOCIAL_TABLE, row.id, { publish: next.publish });
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
      await adminDelete(SOCIAL_TABLE, id);
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
      const result = (await adminPost(SOCIAL_TABLE, {
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Social media</h1>
          <p className="text-sm text-zinc-500 mt-1">
            These links appear in the footer of every page. Drag to reorder, toggle visibility per row, and only published links appear live.
          </p>
        </div>
        <button
          onClick={addItem}
          disabled={adding}
          className="px-4 py-2 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
        >
          {adding ? "Adding…" : <><span className="text-lg leading-none">+</span> Add Link</>}
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-2xl bg-white">
          No social links yet. Click &quot;Add link&quot; to add one.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
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
