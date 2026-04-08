import { NextResponse } from "next/server";
import { readFounderBio } from "@/app/lib/about";

export const revalidate = 86400;

export async function GET() {
  try {
    const data = await readFounderBio();

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Route] /api/about-bio error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch about bio",
      },
      { status: 500 }
    );
  }
}
