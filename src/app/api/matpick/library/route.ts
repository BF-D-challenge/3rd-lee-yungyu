import { NextResponse } from "next/server";
import { createTastepinLibrary } from "@/lib/tastepin-library-data";

const parseCoordinate = (value: string | null, min: number, max: number) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = parseCoordinate(url.searchParams.get("lat"), -90, 90);
  const longitude = parseCoordinate(url.searchParams.get("lng"), -180, 180);
  const coordinates = latitude === null || longitude === null
    ? undefined
    : { latitude, longitude };

  return NextResponse.json(createTastepinLibrary(coordinates), {
    headers: { "cache-control": "no-store" },
  });
}
