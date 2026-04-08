import { NextResponse } from "next/server";
import { readFestivalPhotos } from "@/app/lib/about";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await readFestivalPhotos();

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Route] /api/festival-photos error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch festival photos",
      },
      { status: 500 }
    );
  }
}
