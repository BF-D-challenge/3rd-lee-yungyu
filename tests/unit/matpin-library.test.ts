import { describe, expect, it } from "vitest";
import type { MatpinSavedPlace } from "@/lib/matpin/contract";
import {
  groupMatpinPlacesByStation,
  matpinPrivateHref,
  matpinReelPath,
  matpinUniqueReelCount,
} from "@/lib/matpin/library";

function saved(overrides: {
  id: number;
  messageId: string;
  reelId: string;
  placeId: string;
  name: string;
  station: string;
}): MatpinSavedPlace {
  return {
    id: overrides.id,
    messageId: overrides.messageId,
    reelId: overrides.reelId,
    reelUrl: `https://www.instagram.com/reel/${overrides.reelId}/`,
    place: {
      id: overrides.placeId,
      name: overrides.name,
      area: overrides.station,
      category: "한식",
      address: `서울 ${overrides.station} 근처`,
      latitude: 37.54,
      longitude: 127.05,
      mapUrl: `https://maps.google.com/?q=${overrides.placeId}`,
      confidence: 0.95,
      matchReason: `${overrides.station} 장소로 확인했어요.`,
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: `2026-08-0${overrides.id}T10:00:00.000Z`,
  };
}

describe("Matpin station reel library", () => {
  it("shows one multi-place reel in every related station without mixing station details", () => {
    const places = [
      saved({ id: 1, messageId: "11111111-1111-4111-8111-111111111111", reelId: "reel-a", placeId: "a-1", name: "성수 식당", station: "성수역" }),
      saved({ id: 2, messageId: "11111111-1111-4111-8111-111111111111", reelId: "reel-a", placeId: "a-2", name: "뚝섬 카페", station: "뚝섬역" }),
      saved({ id: 3, messageId: "33333333-3333-4333-8333-333333333333", reelId: "reel-b", placeId: "b-1", name: "성수 국밥", station: "성수역" }),
    ];

    const groups = groupMatpinPlacesByStation(places);
    const seongsu = groups.find((group) => group.name === "성수역");
    const ttukseom = groups.find((group) => group.name === "뚝섬역");

    expect(matpinUniqueReelCount(places)).toBe(2);
    expect(seongsu?.reels.map((reel) => reel.reelId).sort()).toEqual(["reel-a", "reel-b"]);
    expect(seongsu?.reels.find((reel) => reel.reelId === "reel-a")?.places.map((item) => item.place.name)).toEqual(["성수 식당"]);
    expect(ttukseom?.reels).toHaveLength(1);
    expect(ttukseom?.reels[0].places.map((item) => item.place.name)).toEqual(["뚝섬 카페"]);
  });

  it("keeps the private token in the fragment while preserving station context", () => {
    const path = matpinReelPath("reel-a", "성수역");
    const href = matpinPrivateHref(path, "private-token", true);

    expect(href).toBe("/matpin/reel/reel-a?station=%EC%84%B1%EC%88%98%EC%97%AD&preview=station-reels#token=private-token");
    expect(href.split("#")[0]).not.toContain("private-token");
  });
});
