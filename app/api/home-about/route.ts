import { NextResponse } from "next/server";
import { readHomeAbout } from "@/app/lib/home";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await readHomeAbout();

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Route] /api/home-about error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch home about data",
      },
      { status: 500 }
    );
  }
}
