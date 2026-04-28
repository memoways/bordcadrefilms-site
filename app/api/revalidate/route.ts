import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.REVALIDATE_SECRET;

// POST /api/revalidate
// Body: { "secret": "...", "tag": "site-config" | "news" | "all" }
// Called by Airtable Automation webhook after a record change.
export async function POST(req: NextRequest) {
  const { secret, tag } = (await req.json()) as { secret?: string; tag?: string };

  if (SECRET && secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (tag === "all" || !tag) {
    revalidateTag("site-config", "max");
    revalidateTag("news", "max");
    revalidateTag("bcf-numbers", "max");
    revalidateTag("team", "max");
    revalidateTag("festival-photos", "max");
    revalidateTag("films", "max");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/news");
    revalidatePath("/films");
    return NextResponse.json({ revalidated: "all" });
  }

  revalidateTag(tag, "max");

  // Also revalidate the relevant path
  const pathMap: Record<string, string[]> = {
    "site-config": ["/", "/about"],
    news: ["/news", "/"],
    "bcf-numbers": ["/about"],
    team: ["/about"],
    "festival-photos": ["/about"],
  };
  for (const path of pathMap[tag] ?? []) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: tag });
}
