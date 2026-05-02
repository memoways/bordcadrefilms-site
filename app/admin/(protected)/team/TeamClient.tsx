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
import { adminPatch, adminPost, adminDelete, adminRevalidate } from "../../lib/api";
import SmartImage from "../../../components/SmartImage";

// ── Types ─────────────────────────────────────────────────────────────────

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  order: number;
  public: boolean;
};

// ── Sortable row ──────────────────────────────────────────────────────────

const TABLE = process.env.NEXT_PUBLIC_AIRTABLE_TEAM_TABLE ?? "Team";

function SortableRow({
  member,
  expanded,
  onExpand,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  member: TeamMember;
  expanded: boolean;
  onExpand: () => void;
  onSave: (m: TeamMember) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: member.id });

  const [draft, setDraft] = useState<TeamMember>(member);

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
      } ${!member.public && !expanded ? "border-orange-100 bg-orange-50/20" : ""}`}
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

        {member.imageUrl ? (
          <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden border border-zinc-200 shadow-xs">
            <SmartImage
              src={member.imageUrl}
              alt={member.name}
              fill
              className="object-cover"
              sizes="40px"
              skeletonClassName="bg-zinc-100"
            />
          </div>
        ) : (
          <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-500 border border-zinc-200 shadow-xs">
            {member.name.charAt(0).toUpperCase() || "?"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate flex items-center gap-2">
            {member.name || "—"}
            {!member.public && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-wider">
                Draft
              </span>
            )}
          </p>
          <p className="text-xs text-zinc-400 truncate font-medium">{member.role}</p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => onDelete(member.id)}
            disabled={deleting}
            className="text-xs p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Delete member"
          >
            {deleting ? "…" : "✕"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 py-6 bg-white">
          <div className="flex justify-center mb-6">
            {draft.imageUrl ? (
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                <SmartImage
                  src={draft.imageUrl}
                  alt={draft.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                  skeletonClassName="bg-zinc-100"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-3xl font-semibold text-zinc-400">
                {draft.name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-5">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <AdminField
                    label="Name"
                    value={draft.name}
                    onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
                  />
                </div>
                <div className="pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={draft.public}
                      onChange={(e) => setDraft((d) => ({ ...d, public: e.target.checked }))}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 transition-colors"
                    />
                    <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      Public visibility
                    </span>
                  </label>
                </div>
              </div>
              <AdminField
                label="Role / Title"
                value={draft.role}
                onChange={(v) => setDraft((d) => ({ ...d, role: v }))}
                placeholder="e.g. Founder & Producer"
              />
              <AdminField
                label="Image URL (Airtable attachment URL)"
                value={draft.imageUrl}
                onChange={(v) => setDraft((d) => ({ ...d, imageUrl: v }))}
                placeholder="https://dl.airtable.com/..."
              />
            </div>
            
            <div className="space-y-5">
              <AdminField
                label="Bio"
                value={draft.bio}
                onChange={(v) => setDraft((d) => ({ ...d, bio: v }))}
                multiline
                rows={8}
              />
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

// ── Client Editor ─────────────────────────────────────────────────────────

export function TeamClient({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [mounted, setMounted] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
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

  if (!mounted) return <div className="p-8 text-zinc-400 animate-pulse">Loading editor...</div>;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = members.findIndex((m) => m.id === active.id);
    const newIdx = members.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(members, oldIdx, newIdx).map((m, i) => ({
      ...m,
      order: i + 1,
    }));
    setMembers(reordered);

    try {
      await Promise.all(
        reordered.map((m) => adminPatch(TABLE, m.id, { order: m.order })),
      );
      await adminRevalidate("team");
      setToast({ msg: "Order saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save order", type: "error" });
    }
  }

  async function saveMember(member: TeamMember) {
    setSaving(member.id);
    try {
      await adminPatch(TABLE, member.id, {
        name: member.name,
        role: member.role,
        bio: member.bio,
        order: member.order,
        publish: member.public,
      });
      await adminRevalidate("team");
      setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
      setToast({ msg: "Member saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSaving(null);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Delete this team member?")) return;
    setDeleting(id);
    try {
      await adminDelete(TABLE, id);
      await adminRevalidate("team");
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (expanded === id) setExpanded(null);
      setToast({ msg: "Member deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete", type: "error" });
    } finally {
      setDeleting(null);
    }
  }

  async function addMember() {
    setAdding(true);
    try {
      const newOrder = members.length + 1;
      const result = (await adminPost(TABLE, {
        name: "New member",
        role: "",
        bio: "",
        order: newOrder,
        publish: false,
      })) as { id: string };
      const newMember: TeamMember = {
        id: result.id,
        name: "New member",
        role: "",
        bio: "",
        imageUrl: "",
        order: newOrder,
        public: false,
      };
      setMembers((prev) => [...prev, newMember]);
      setExpanded(result.id);
      setToast({ msg: "Member added — fill in the details", type: "success" });
    } catch {
      setToast({ msg: "Failed to add member", type: "error" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Team</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Drag rows to reorder. Members appear on the About page.
          </p>
        </div>
        <button
          onClick={addMember}
          disabled={adding}
          className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
        >
          {adding ? "Adding…" : <><span className="text-lg leading-none">+</span> Add Team Member</>}
        </button>
      </div>

      {members.length === 0 && (
        <div className="text-center py-20 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-2xl bg-white">
          No team members yet. Click &quot;Add member&quot; to create the first one.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 gap-4">
            {members.map((m) => (
              <SortableRow
                key={m.id}
                member={m}
                expanded={expanded === m.id}
                onExpand={() => setExpanded((e) => (e === m.id ? null : m.id))}
                onSave={saveMember}
                onDelete={deleteMember}
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
