"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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

export type AboutIntroData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
};

export type FounderData = {
  id: string;
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
};

export type FestivalPhoto = {
  id: string;
  title: string;
  festival: string;
  year: string;
  imageUrl: string;
  order: number;
};

// ── Sortable photo row ────────────────────────────────────────────────────

function SortablePhotoRow({
  photo,
  onDelete,
  onUpdate,
  deleting,
  saving,
}: {
  photo: FestivalPhoto;
  onDelete: (id: string) => void;
  onUpdate: (p: FestivalPhoto) => void;
  deleting: boolean;
  saving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });
  const [draft, setDraft] = useState(photo);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white border border-zinc-200 rounded-xl p-4 space-y-3 ${isDragging ? "shadow-xl opacity-80" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none text-xl"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <span className="text-sm font-medium text-zinc-700 flex-1 truncate">
          {draft.title || "Untitled photo"}
        </span>
        <button
          onClick={() => onDelete(photo.id)}
          disabled={deleting}
          className="text-xs text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AdminField label="Title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
        <AdminField label="Festival" value={draft.festival} onChange={(v) => setDraft((d) => ({ ...d, festival: v }))} />
        <AdminField label="Year" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} type="number" />
        <AdminField label="Order" value={String(draft.order)} onChange={(v) => setDraft((d) => ({ ...d, order: Number(v) || d.order }))} type="number" />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => onUpdate(draft)}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save photo"}
        </button>
      </div>
    </div>
  );
}

// ── Client Editor ─────────────────────────────────────────────────────────

const PHOTO_TABLE = process.env.NEXT_PUBLIC_FESTIVAL_PHOTOS_TABLE ?? "FestivalPhotos";

export function AboutClient({
  initialIntro,
  initialFounder,
  initialPhotos,
}: {
  initialIntro: AboutIntroData | null;
  initialFounder: FounderData | null;
  initialPhotos: FestivalPhoto[];
}) {
  const router = useRouter();
  const [intro, setIntro] = useState<AboutIntroData>(
    initialIntro ?? { id: "", title: "", subtitle: "", description: "" },
  );
  const [founder, setFounder] = useState<FounderData>(
    initialFounder ?? { id: "", name: "", title: "", bio: "", imageUrl: "" },
  );
  const [photos, setPhotos] = useState<FestivalPhoto[]>(initialPhotos);
  const [savingIntro, setSavingIntro] = useState(false);
  const [savingFounder, setSavingFounder] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function saveIntro() {
    setSavingIntro(true);
    try {
      const fields = {
        section: "home_about",
        title: intro.title,
        subtitle: intro.subtitle,
        description: intro.description,
      };
      if (intro.id) {
        await adminPatch("SiteConfig", intro.id, fields);
      } else {
        const result = (await adminPost("SiteConfig", fields)) as { id: string };
        setIntro((d) => ({ ...d, id: result.id }));
      }
      await adminRevalidate("site-config");
      router.refresh();
      setToast({ msg: "About text saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingIntro(false);
    }
  }

  async function saveFounder() {
    setSavingFounder(true);
    try {
      const fields = {
        section: "founder",
        name: founder.name,
        title: founder.title,
        bio: founder.bio,
      };
      if (founder.id) {
        await adminPatch("SiteConfig", founder.id, fields);
      } else {
        const result = (await adminPost("SiteConfig", fields)) as { id: string };
        setFounder((f) => ({ ...f, id: result.id }));
      }
      await adminRevalidate("site-config");
      router.refresh();
      setToast({ msg: "Founder bio saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingFounder(false);
    }
  }

  async function handlePhotoDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = photos.findIndex((p) => p.id === active.id);
    const newIdx = photos.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(photos, oldIdx, newIdx).map((p, i) => ({ ...p, order: i + 1 }));
    setPhotos(reordered);

    try {
      await Promise.all(reordered.map((p) => adminPatch(PHOTO_TABLE, p.id, { order: p.order })));
      await adminRevalidate("festival-photos");
      setToast({ msg: "Order saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save order", type: "error" });
    }
  }

  async function savePhoto(photo: FestivalPhoto) {
    setSavingPhoto(photo.id);
    try {
      await adminPatch(PHOTO_TABLE, photo.id, {
        title: photo.title,
        festival: photo.festival,
        year: photo.year,
        order: photo.order,
      });
      await adminRevalidate("festival-photos");
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? photo : p)));
      setToast({ msg: "Photo saved", type: "success" });
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSavingPhoto(null);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Delete this festival photo?")) return;
    setDeletingPhoto(id);
    try {
      await adminDelete(PHOTO_TABLE, id);
      await adminRevalidate("festival-photos");
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setToast({ msg: "Photo deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete", type: "error" });
    } finally {
      setDeletingPhoto(null);
    }
  }

  async function addPhoto() {
    setAddingPhoto(true);
    try {
      const result = (await adminPost(PHOTO_TABLE, {
        title: "New photo",
        festival: "",
        year: new Date().getFullYear(),
        order: photos.length + 1,
      })) as { id: string };
      setPhotos((prev) => [
        ...prev,
        { id: result.id, title: "New photo", festival: "", year: String(new Date().getFullYear()), imageUrl: "", order: prev.length + 1 },
      ]);
      setToast({ msg: "Photo added", type: "success" });
    } catch {
      setToast({ msg: "Failed to add photo", type: "error" });
    } finally {
      setAddingPhoto(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-zinc-900">About</h1>

      {/* About Intro */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-800">About text</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Displayed at the top of the About page</p>
          </div>
          <button
            onClick={saveIntro}
            disabled={savingIntro}
            className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {savingIntro ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Title" value={intro.title} onChange={(v) => setIntro((d) => ({ ...d, title: v }))} />
          <AdminField label="Subtitle" value={intro.subtitle} onChange={(v) => setIntro((d) => ({ ...d, subtitle: v }))} placeholder="e.g. Depuis 2008" />
        </div>
        <AdminField
          label="Description"
          value={intro.description}
          onChange={(v) => setIntro((d) => ({ ...d, description: v }))}
          multiline
          rows={5}
        />
      </div>

      {/* Founder Bio */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Founder Bio</h2>
          <button
            onClick={saveFounder}
            disabled={savingFounder}
            className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {savingFounder ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Name" value={founder.name} onChange={(v) => setFounder((f) => ({ ...f, name: v }))} />
          <AdminField label="Title / Role" value={founder.title} onChange={(v) => setFounder((f) => ({ ...f, title: v }))} />
        </div>
        <AdminField label="Bio" value={founder.bio} onChange={(v) => setFounder((f) => ({ ...f, bio: v }))} multiline rows={6} />
        <p className="text-xs text-zinc-400">Profile image is managed via Airtable attachments field.</p>
      </div>

      {/* Festival Photos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Festival Photos</h2>
          <button
            onClick={addPhoto}
            disabled={addingPhoto}
            className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {addingPhoto ? "Adding…" : "+ Add photo"}
          </button>
        </div>
        <p className="text-xs text-zinc-400">Drag to reorder. Images are managed via Airtable attachments.</p>

        {photos.length === 0 && (
          <div className="text-center py-10 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl">
            No festival photos yet.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {photos.map((p) => (
                <SortablePhotoRow
                  key={p.id}
                  photo={p}
                  onDelete={deletePhoto}
                  onUpdate={savePhoto}
                  deleting={deletingPhoto === p.id}
                  saving={savingPhoto === p.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <AdminToast message={toast?.msg ?? null} type={toast?.type} onDismiss={dismiss} />
    </div>
  );
}
