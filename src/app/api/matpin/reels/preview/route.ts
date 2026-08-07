import { NextResponse } from "next/server";
import { loadInstagramReelPresentation } from "@/lib/matpin/reel-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reelUrl = new URL(request.url).searchParams.get("url")?.trim();
  if (!reelUrl) {
    return NextResponse.json(
      { thumbnailUrl: null, videoUrl: null, ownerUsername: null },
      { status: 400 },
    );
  }

  try {
    const presentation = await loadInstagramReelPresentation(reelUrl);
    return NextResponse.json(
      presentation ?? { thumbnailUrl: null, videoUrl: null, ownerUsername: null },
      { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json(
      { thumbnailUrl: null, videoUrl: null, ownerUsername: null },
      { status: 502, headers: { "cache-control": "public, max-age=60" } },
    );
  }
}
