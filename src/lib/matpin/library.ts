import type { MatpinSavedPlace } from "@/lib/matpin/contract";
import { stationForMatpinPlace } from "@/lib/matpin/stations";

export type MatpinStationReel = {
  key: string;
  reelId: string;
  reelUrl: string | null;
  places: MatpinSavedPlace[];
  savedAt: string;
  distanceMeters: number | null;
};

export type MatpinStationGroup = {
  name: string;
  isStation: boolean;
  reels: MatpinStationReel[];
  latestSavedAt: string;
};

export const MATPIN_DEVELOPMENT_PREVIEW_PLACES: MatpinSavedPlace[] = [
  {
    id: 1,
    messageId: "11111111-1111-4111-8111-111111111111",
    reelId: "DbTBhcZNY1b",
    reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
    place: {
      id: "preview-sanjang",
      name: "산장장작구이",
      area: "역삼역",
      category: "한식",
      address: "서울 강남구 봉은사로30길 70 1층",
      latitude: 37.5029761,
      longitude: 127.0367068,
      mapUrl: "https://maps.google.com/?q=%EC%82%B0%EC%9E%A5%EC%9E%A5%EC%9E%91%EA%B5%AC%EC%9D%B4+%EC%97%AD%EC%82%BC",
      confidence: 0.96,
      matchReason: "영상의 간판과 메뉴에서 확인한 장소예요.",
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: "2026-08-02T02:30:00.000Z",
  },
  {
    id: 2,
    messageId: "22222222-2222-4222-8222-222222222222",
    reelId: "C3kGesnvLr2",
    reelUrl: "https://www.instagram.com/reel/C3kGesnvLr2/",
    place: {
      id: "preview-dotgogi",
      name: "돝고기506",
      area: "역삼역",
      category: "한식",
      address: "서울 강남구 역삼로17길 53",
      latitude: 37.4963358,
      longitude: 127.0362866,
      mapUrl: "https://maps.google.com/?q=%EB%8F%9D%EA%B3%A0%EA%B8%B0506",
      confidence: 0.93,
      matchReason: "릴스의 캡션에서 확인한 장소예요.",
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: "2026-08-01T17:10:00.000Z",
  },
  {
    id: 3,
    messageId: "33333333-3333-4333-8333-333333333333",
    reelId: "DMSqZGLSOA9",
    reelUrl: "https://www.instagram.com/reel/DMSqZGLSOA9/",
    place: {
      id: "preview-chisot",
      name: "치솟 역삼본점",
      area: "역삼역",
      category: "일식",
      address: "서울 강남구 봉은사로30길 59 1층 102호",
      latitude: 37.5036927,
      longitude: 127.0366875,
      mapUrl: "https://maps.google.com/?q=%EC%B9%98%EC%86%9F+%EC%97%AD%EC%82%BC%EB%B3%B8%EC%A0%90",
      confidence: 0.91,
      matchReason: "릴스의 캡션과 영상에서 확인한 장소예요.",
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: "2026-07-30T12:15:00.000Z",
  },
];

function minDistance(current: number | null, next: number | null): number | null {
  if (current === null) return next;
  if (next === null) return current;
  return Math.min(current, next);
}

export function groupMatpinPlacesByStation(places: MatpinSavedPlace[]): MatpinStationGroup[] {
  const groups = new Map<string, MatpinStationGroup & { reelMap: Map<string, MatpinStationReel> }>();

  for (const saved of places) {
    const station = stationForMatpinPlace(saved.place);
    const existingGroup = groups.get(station.name) ?? {
      name: station.name,
      isStation: station.isStation,
      reels: [],
      reelMap: new Map<string, MatpinStationReel>(),
      latestSavedAt: saved.savedAt,
    };
    const reelKey = saved.reelId || saved.messageId;
    const existingReel = existingGroup.reelMap.get(reelKey);
    if (existingReel) {
      existingReel.places.push(saved);
      existingReel.distanceMeters = minDistance(existingReel.distanceMeters, station.distanceMeters);
      if (saved.savedAt > existingReel.savedAt) existingReel.savedAt = saved.savedAt;
    } else {
      existingGroup.reelMap.set(reelKey, {
        key: `${station.name}-${reelKey}`,
        reelId: saved.reelId,
        reelUrl: saved.reelUrl,
        places: [saved],
        savedAt: saved.savedAt,
        distanceMeters: station.distanceMeters,
      });
    }
    if (saved.savedAt > existingGroup.latestSavedAt) existingGroup.latestSavedAt = saved.savedAt;
    groups.set(station.name, existingGroup);
  }

  return Array.from(groups.values())
    .map(({ reelMap, ...group }) => ({
      ...group,
      reels: Array.from(reelMap.values()).sort((left, right) => right.savedAt.localeCompare(left.savedAt)),
    }))
    .sort((left, right) => right.latestSavedAt.localeCompare(left.latestSavedAt));
}

export function matpinReelSearchText(reel: MatpinStationReel): string {
  return reel.places.flatMap((saved) => [
    saved.place.name,
    saved.place.area,
    saved.place.category,
    saved.place.address,
    saved.place.matchReason,
  ]).join(" ").toLocaleLowerCase("ko-KR");
}

export function matpinUniqueReelCount(places: MatpinSavedPlace[]): number {
  return new Set(places.map((saved) => saved.reelId || saved.messageId)).size;
}

export function matpinStationPath(stationName: string): string {
  return `/matpin/station/${encodeURIComponent(stationName)}`;
}

export function matpinReelPath(reelId: string, stationName: string): string {
  const query = new URLSearchParams({ station: stationName });
  return `/matpin/reel/${encodeURIComponent(reelId)}?${query.toString()}`;
}

export function matpinPrivateHref(path: string, token: string, preview: boolean): string {
  const [pathname, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);
  if (preview) query.set("preview", "station-reels");
  const search = query.toString();
  return `${pathname}${search ? `?${search}` : ""}#token=${encodeURIComponent(token)}`;
}
