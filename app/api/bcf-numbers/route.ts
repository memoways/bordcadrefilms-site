import { NextResponse } from "next/server";
import { readBCFNumbers } from "@/app/lib/home";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await readBCFNumbers();

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Route] /api/bcf-numbers error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch BCF numbers",
      },
      { status: 500 }
    );
  }
}
