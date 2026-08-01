import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadImportedMatpickPlaces,
  loadMatpickDmSaves,
  loadSavedMatpickPlaceIds,
  loadTastepinSaves,
  saveMatpickPlace,
  saveTastepinResult,
  saveMatpickDmPlace,
  toggleSavedMatpickPlace,
} from "../../src/lib/storage";
import type { TastepinResolveResponse } from "../../src/lib/tastepin-contract";
import type { MatpickDmResponse } from "../../src/lib/matpick-dm-contract";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const response: TastepinResolveResponse = {
  mode: "live",
  platform: "youtube_shorts",
  extraction: {
    status: "resolved",
    summary: "영상에서 식당을 찾았어요.",
    places: [{
      name: "테스트식당",
      branch: null,
      menus: ["비빔밥"],
      regionHints: ["서울"],
      confidence: 0.9,
      evidence: [{
        kind: "on_screen_text",
        text: "테스트식당",
        timestampSeconds: 4,
      }],
    }],
  },
  mapStatus: "no_match",
  mapCandidates: [],
};

const dmResponse: MatpickDmResponse = {
  mode: "mock",
  source: "instagram_dm",
  sender: {
    scopedId: "device-demo-user",
    label: "이 기기의 데모 사용자",
  },
  messageId: "mock-dm-DbTBhcZNY1b",
  reel: {
    id: "DbTBhcZNY1b",
    url: "https://www.instagram.com/reel/DbTBhcZNY1b/",
    creator: "@mattjun11",
    title: "지리산 흑돼지 껍데기 삼겹",
    thumbnailUrl: "/images/matpick/yeoksam-sanjang-reel.jpg",
    publishedAt: "2026-07-27",
  },
  status: "needs_confirmation",
  candidates: [{
    id: "yeoksam-sanjang",
    name: "산장장작구이",
    area: "역삼역",
    category: "한식",
    address: "서울 강남구 봉은사로30길 70 1층",
    latitude: 37.5029761,
    longitude: 127.0367068,
    mapUrl: "https://www.google.com/maps/search/?api=1&query=test",
    confidence: 0.96,
    matchReason: "릴스의 식당명과 지역 단서가 모두 일치해요.",
  }],
  receivedAt: "2026-07-29T00:00:00.000Z",
  notice: "실제 Instagram DM을 읽지 않는 데모예요.",
};

describe("Tastepin device saves", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores the newest result and replaces a duplicate source URL", () => {
    const sourceUrl = "https://www.youtube.com/shorts/abcdefghijk";

    saveTastepinResult(sourceUrl, response);
    saveTastepinResult(sourceUrl, {
      ...response,
      extraction: { ...response.extraction, summary: "다시 분석한 결과예요." },
    });

    expect(loadTastepinSaves()).toHaveLength(1);
    expect(loadTastepinSaves()[0]).toMatchObject({
      id: sourceUrl,
      sourceUrl,
      result: {
        extraction: { summary: "다시 분석한 결과예요." },
      },
    });
  });

  it("ignores malformed browser storage", () => {
    localStorage.setItem("oneul:tastepin-saves:v1", JSON.stringify([null, { id: 1 }]));
    expect(loadTastepinSaves()).toEqual([]);
  });

  it("keeps MATPICK place saves across reads and removes the same place on a second toggle", () => {
    expect(toggleSavedMatpickPlace({ id: "yeoksam-daewoo" })).toMatchObject({
      saved: true,
      ids: ["yeoksam-daewoo"],
    });
    expect(loadSavedMatpickPlaceIds()).toEqual(["yeoksam-daewoo"]);

    expect(toggleSavedMatpickPlace({ id: "yeoksam-daewoo" })).toMatchObject({
      saved: false,
      ids: [],
    });
  });

  it("확정 저장은 같은 MATPICK 장소를 중복으로 추가하지 않는다", () => {
    saveMatpickPlace({ id: "yeoksam-sanjang" });
    saveMatpickPlace({ id: "yeoksam-sanjang" });

    expect(loadSavedMatpickPlaceIds()).toEqual(["yeoksam-sanjang"]);
  });

  it("shows a place added from YouTube Shorts in the MATPICK map collection", () => {
    saveTastepinResult("https://www.youtube.com/shorts/abcdefghijk", {
      ...response,
      mapStatus: "candidates",
      mapCandidates: [{
        id: "place-1",
        name: "테스트식당",
        category: "한식",
        address: "서울 테스트구",
        roadAddress: "서울 테스트로 1",
        phone: "",
        longitude: "127.0",
        latitude: "37.5",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=test",
      }],
    });

    expect(loadImportedMatpickPlaces()).toEqual([
      expect.objectContaining({
        id: "import-abcdefghijk-place-1",
        name: "테스트식당",
        source: expect.objectContaining({
          platform: "youtube_shorts",
          url: "https://www.youtube.com/shorts/abcdefghijk",
        }),
        youtubeMentions: [
          expect.objectContaining({ id: "abcdefghijk" }),
        ],
        instagramMentions: [],
      }),
    ]);
  });

  it("확인한 Instagram DM 장소를 사용자 저장함에 한 번만 추가한다", () => {
    const first = saveMatpickDmPlace(dmResponse, dmResponse.candidates[0]);
    const duplicate = saveMatpickDmPlace(dmResponse, dmResponse.candidates[0]);

    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(loadMatpickDmSaves()).toHaveLength(1);
    expect(loadImportedMatpickPlaces()).toEqual([
      expect.objectContaining({
        id: "yeoksam-sanjang",
        name: "산장장작구이",
        source: expect.objectContaining({
          platform: "instagram_reel",
          creator: "@mattjun11",
        }),
        instagramMentions: [
          expect.objectContaining({
            id: "DbTBhcZNY1b",
            kind: "reel",
          }),
        ],
      }),
    ]);
  });
});
