import { NextResponse } from "next/server";
import { readTeam } from "@/app/lib/about";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await readTeam();

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Route] /api/team error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch team data",
      },
      { status: 500 }
    );
  }
}
