"use client";

import { useCallback, useEffect, useState } from "react";
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
import ImageUploadField from "../../components/ImageUploadField";
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
  public: boolean;
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
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <AdminField label="Order" value={String(draft.order)} onChange={(v) => setDraft((d) => ({ ...d, order: Number(v) || d.order }))} type="number" />
          </div>
          <div className="pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={draft.public}
                onChange={(e) => setDraft((d) => ({ ...d, public: e.target.checked }))}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 transition-colors"
              />
              <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-700 transition-colors">
                Public
              </span>
            </label>
          </div>
        </div>
      </div>
      <ImageUploadField
        label="Image"
        imageUrl={draft.imageUrl}
        onImageUrlChange={(v) => setDraft((d) => ({ ...d, imageUrl: v }))}
      />
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
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!mounted) return <div className="p-8 text-zinc-400 animate-pulse">Loading editor...</div>;

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
      const fieldsToUpdate: Record<string, unknown> = {
        title: photo.title,
        festival: photo.festival,
        year: photo.year,
        order: photo.order,
        public: photo.public,
      };

      // Only include image if it's a URL string (not stored as attachment array)
      if (photo.imageUrl) {
        fieldsToUpdate.image = [{ url: photo.imageUrl }];
      }

      await adminPatch(PHOTO_TABLE, photo.id, fieldsToUpdate);
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
      const currentYear = String(new Date().getFullYear());
      const result = (await adminPost(PHOTO_TABLE, {
        title: "New photo",
        festival: "",
        year: currentYear,
        order: photos.length + 1,
        public: false,
      })) as { id: string };
      setPhotos((prev) => [
        ...prev,
        { id: result.id, title: "New photo", festival: "", year: currentYear, imageUrl: "", order: prev.length + 1, public: false },
      ]);
      setToast({ msg: "Photo added", type: "success" });
    } catch {
      setToast({ msg: "Failed to add photo", type: "error" });
    } finally {
      setAddingPhoto(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">About Page</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left Column: Text Content */}
        <div className="space-y-8">
          {/* About Intro */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  About Intro
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Top of About page</p>
              </div>
              <button
                onClick={saveIntro}
                disabled={savingIntro}
                className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {savingIntro ? "Saving…" : "Save Intro"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminField label="Title" value={intro.title} onChange={(v) => setIntro((d) => ({ ...d, title: v }))} />
              <AdminField label="Subtitle" value={intro.subtitle} onChange={(v) => setIntro((d) => ({ ...d, subtitle: v }))} placeholder="e.g. Depuis 2008" />
            </div>
            <AdminField
              label="Description"
              value={intro.description}
              onChange={(v) => setIntro((d) => ({ ...d, description: v }))}
              multiline
              rows={6}
            />
          </div>

          {/* Founder Bio */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Founder Bio
              </h2>
              <button
                onClick={saveFounder}
                disabled={savingFounder}
                className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {savingFounder ? "Saving…" : "Save Bio"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminField label="Name" value={founder.name} onChange={(v) => setFounder((f) => ({ ...f, name: v }))} />
              <AdminField label="Title / Role" value={founder.title} onChange={(v) => setFounder((f) => ({ ...f, title: v }))} />
            </div>
            <AdminField label="Bio" value={founder.bio} onChange={(v) => setFounder((f) => ({ ...f, bio: v }))} multiline rows={8} />
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Image managed in Airtable</p>
          </div>
        </div>

        {/* Right Column: Photos */}
        <div className="space-y-6">
          <div className="bg-zinc-100/50 border border-zinc-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Festival Gallery
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Drag to reorder photos</p>
              </div>
              <button
                onClick={addPhoto}
                disabled={addingPhoto}
                className="px-4 py-1.5 text-sm font-medium bg-white border border-zinc-200 text-zinc-900 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                {addingPhoto ? "Adding…" : "+ Add photo"}
              </button>
            </div>

            {photos.length === 0 && (
              <div className="text-center py-12 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-xl bg-white">
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
        </div>
      </div>

      <AdminToast message={toast?.msg ?? null} type={toast?.type} onDismiss={dismiss} />
    </div>
  );
}
