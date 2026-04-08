import { NextResponse } from "next/server";
import { readHeroVideo } from "@/app/lib/hero";

export const revalidate = 3600;

export async function GET() {
  const hero = await readHeroVideo();

  return NextResponse.json(
    {
      ok: true,
      data: hero,
    },
    {
      status: 200,
    }
  );
}
