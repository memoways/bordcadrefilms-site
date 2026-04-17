// Client-side helpers for admin mutations — called from "use client" components

export async function adminPatch(
  table: string,
  id: string,
  fields: Record<string, unknown>,
) {
  const res = await fetch(`/api/admin/records/${encodeURIComponent(table)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, fields }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminPost(
  table: string,
  fields: Record<string, unknown>,
) {
  const res = await fetch(`/api/admin/records/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminDelete(table: string, id: string) {
  const res = await fetch(
    `/api/admin/records/${encodeURIComponent(table)}?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminRevalidate(tag: string) {
  const res = await fetch("/api/admin/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  });
  if (!res.ok) throw new Error(await res.text());
}
