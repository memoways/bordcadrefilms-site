import { auth } from "@clerk/nextjs/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Allowlisted tags — prevents arbitrary cache busting
const ALLOWED_TAGS = new Set([
  "site-config",
  "news",
  "bcf-numbers",
  "team",
  "festival-photos",
  "films",
  "social-media",
  "all",
]);

const PATH_MAP: Record<string, string[]> = {
  "site-config": ["/", "/about"],
  news: ["/news", "/"],
  "bcf-numbers": ["/about"],
  team: ["/about"],
  "festival-photos": ["/about"],
  films: ["/completed-films"],
  // Footer shows on every page — tag revalidation handles the fetch cache,
  // plus nudge the key SSG paths so they regenerate.
  "social-media": ["/", "/news", "/about", "/directors", "/completed-films"],
};

// POST /api/admin/revalidate
// Body: FormData { tag } or JSON { tag }
// Called from the admin dashboard revalidation buttons.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Support both FormData (from plain HTML form) and JSON
  let tag: string | undefined;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    tag = form.get("tag")?.toString();
  } else {
    const body = await req.json().catch(() => ({})) as { tag?: string };
    tag = body.tag;
  }

  if (!tag || !ALLOWED_TAGS.has(tag)) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
  }

  if (tag === "all") {
    for (const t of ALLOWED_TAGS) {
      if (t !== "all") revalidateTag(t, "max");
    }
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/news");
    revalidatePath("/completed-films");
    return NextResponse.json({ revalidated: "all" });
  }

  revalidateTag(tag, "max");
  for (const p of PATH_MAP[tag] ?? []) {
    revalidatePath(p);
  }

  return NextResponse.json({ revalidated: tag });
}
