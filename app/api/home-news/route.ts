import { NextResponse } from "next/server";
import { readHomeNews } from "@/app/lib/home";

export const revalidate = 1800;

export async function GET() {
  try {
    const data = await readHomeNews(3);

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Route] /api/home-news error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch home news",
      },
      { status: 500 }
    );
  }
}
