// Client-side helpers for admin mutations — called from "use client" components

async function getResponseError(res: Response) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (json?.error) return String(json.error);
    if (json?.message) return String(json.message);
    return JSON.stringify(json);
  } catch {
    return text;
  }
}

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
  if (!res.ok) throw new Error(await getResponseError(res));
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
  if (!res.ok) throw new Error(await getResponseError(res));
  return res.json();
}

export async function adminDelete(table: string, id: string) {
  const res = await fetch(
    `/api/admin/records/${encodeURIComponent(table)}?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(await getResponseError(res));
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
