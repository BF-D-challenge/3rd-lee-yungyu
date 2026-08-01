import { NextResponse } from "next/server";
import {
  instagramReelId,
  matpickDmRequestSchema,
  matpickDmResponseSchema,
  normalizeInstagramReelUrl,
  type MatpickDmCandidate,
} from "@/lib/matpick-dm-contract";
import { createTastepinLibrary } from "@/lib/tastepin-library-data";

export const runtime = "nodejs";

const KNOWN_REEL_PLACE_IDS: Record<string, string> = {
  C3kGesnvLr2: "yeoksam-dotgogi",
  DMSqZGLSOA9: "yeoksam-chisot",
  DbTBhcZNY1b: "yeoksam-sanjang",
};

const FALLBACK_PLACE_IDS = [
  "yeoksam-sanjang",
  "yeoksam-chisot",
  "yeoksam-dotgogi",
] as const;

const toCandidate = (
  place: ReturnType<typeof createTastepinLibrary>["places"][number],
  confidence: number,
  matchReason: string,
): MatpickDmCandidate => ({
  id: place.id,
  name: place.name,
  area: place.area,
  category: place.category,
  address: place.address,
  latitude: place.latitude,
  longitude: place.longitude,
  mapUrl: place.mapUrl,
  confidence,
  matchReason,
});

export async function POST(request: Request) {
  const parsedBody = matpickDmRequestSchema.safeParse(await request.json().catch(() => null));
  const normalizedUrl = parsedBody.success
    ? normalizeInstagramReelUrl(parsedBody.data.reelUrl)
    : null;
  const reelId = normalizedUrl ? instagramReelId(normalizedUrl) : null;

  if (!normalizedUrl || !reelId) {
    return NextResponse.json(
      {
        error: "unsupported_reel_url",
        message: "instagram.com/reel/로 시작하는 공개 릴스 링크를 넣어주세요.",
      },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const library = createTastepinLibrary();
  const knownPlaceId = KNOWN_REEL_PLACE_IDS[reelId];
  const candidateIds = knownPlaceId
    ? [knownPlaceId, ...FALLBACK_PLACE_IDS.filter((id) => id !== knownPlaceId)].slice(0, 2)
    : [...FALLBACK_PLACE_IDS];
  const places = candidateIds.flatMap((id) => {
    const place = library.places.find((item) => item.id === id);
    return place ? [place] : [];
  });
  const knownPlace = knownPlaceId
    ? places.find((place) => place.id === knownPlaceId)
    : undefined;
  const mention = knownPlace?.instagramMentions.find((item) => item.id === reelId);

  const response = matpickDmResponseSchema.parse({
    mode: "mock",
    source: "instagram_dm",
    sender: {
      scopedId: "device-demo-user",
      label: "이 기기의 데모 사용자",
    },
    messageId: `mock-dm-${reelId}`,
    reel: {
      id: reelId,
      url: normalizedUrl,
      creator: mention?.creator ?? "공개 Instagram Reel",
      title: mention?.title ?? "릴스에서 받은 맛집 후보",
      thumbnailUrl: mention?.thumbnailUrl ?? null,
      publishedAt: mention?.publishedAt ?? null,
    },
    status: "needs_confirmation",
    candidates: places.map((place, index) => toCandidate(
      place,
      knownPlace && place.id === knownPlace.id ? 0.96 : 0.72 - index * 0.05,
      knownPlace && place.id === knownPlace.id
        ? "릴스의 식당명과 지역 단서가 모두 일치해요."
        : "역삼역과 메뉴 단서가 비슷해 확인이 필요해요.",
    )),
    receivedAt: new Date().toISOString(),
    notice: "실제 Instagram DM을 읽지 않는 데모예요. 입력한 공개 릴스 링크만 Mock API로 처리했습니다.",
  });

  return NextResponse.json(response, {
    headers: { "cache-control": "no-store" },
  });
}
