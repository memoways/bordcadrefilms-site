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
import { adminPatch, adminPost, adminDelete, adminRevalidate } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  order: number;
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

        <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-500">
          {member.name.charAt(0).toUpperCase() || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{member.name || "—"}</p>
          <p className="text-xs text-zinc-400 truncate">{member.role}</p>
        </div>

        <button
          onClick={onExpand}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors"
        >
          {expanded ? "Close" : "Edit"}
        </button>
        <button
          onClick={() => onDelete(member.id)}
          disabled={deleting}
          className="text-xs px-2 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-4 space-y-4 bg-zinc-50">
          <div className="grid grid-cols-2 gap-4">
            <AdminField
              label="Name"
              value={draft.name}
              onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            />
            <AdminField
              label="Role / Title"
              value={draft.role}
              onChange={(v) => setDraft((d) => ({ ...d, role: v }))}
            />
          </div>
          <AdminField
            label="Bio"
            value={draft.bio}
            onChange={(v) => setDraft((d) => ({ ...d, bio: v }))}
            multiline
            rows={3}
          />
          <AdminField
            label="Image URL (Airtable attachment URL)"
            value={draft.imageUrl}
            onChange={(v) => setDraft((d) => ({ ...d, imageUrl: v }))}
            placeholder="https://dl.airtable.com/..."
          />
          <div className="flex justify-end">
            <button
              onClick={() => onSave(draft)}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save member"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client Editor ─────────────────────────────────────────────────────────

export function TeamClient({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
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
      })) as { id: string };
      const newMember: TeamMember = {
        id: result.id,
        name: "New member",
        role: "",
        bio: "",
        imageUrl: "",
        order: newOrder,
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Team</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Drag rows to reorder. Changes save immediately.
          </p>
        </div>
        <button
          onClick={addMember}
          disabled={adding}
          className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {adding ? "Adding…" : "+ Add member"}
        </button>
      </div>

      {members.length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl">
          No team members yet. Click &quot;Add member&quot; to create the first one.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
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
