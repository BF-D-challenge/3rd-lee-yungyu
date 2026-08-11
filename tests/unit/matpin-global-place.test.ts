import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveMatpinPlacesWithMetrics } from "@/lib/matpin/place-resolver";
import { stationForMatpinPlace } from "@/lib/matpin/stations";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Matpin global place provider routing", () => {
  it.each([
    ["restaurant", "FD6", "음식점 > 한식"],
    ["cafe", "CE7", "카페 > 커피전문점"],
    ["attraction", "AT4", "관광명소 > 박물관"],
    ["lodging", "AD5", "숙박 > 호텔"],
  ] as const)("uses Kakao first for domestic %s places", async (placeType, categoryCode, categoryName) => {
    vi.stubEnv("KAKAO_REST_API_KEY", "kakao-test-key");
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "google-should-not-be-used");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      documents: [{
        id: `kakao-${placeType}`,
        place_name: "서울 장소",
        category_name: categoryName,
        category_group_code: categoryCode,
        address_name: "서울특별시 중구 세종대로 1",
        road_address_name: "서울특별시 중구 세종대로 1",
        x: "126.9780",
        y: "37.5665",
        place_url: `https://place.map.kakao.com/${placeType}`,
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const resolved = await resolveMatpinPlacesWithMetrics({
      status: "resolved",
      summary: "서울 장소를 확인했어요.",
      places: [{
        name: "서울 장소",
        placeType,
        branch: null,
        menus: [],
        regionHints: ["서울 중구"],
        confidence: 0.96,
        evidence: [{ kind: "caption", text: "서울 장소", timestampSeconds: null }],
      }],
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestUrl.searchParams.get("category_group_code")).toBe(categoryCode);
    expect(resolved.metrics.provider).toBe("kakao_local");
    expect(resolved.candidates[0]).toMatchObject({
      id: `kakao-${placeType}`,
      placeType,
      countryCode: "KR",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("Matpin overseas station fallback", () => {
  it("does not use Seoul station coordinates when the country is unknown", () => {
    expect(stationForMatpinPlace({
      id: "foreign-place",
      name: "Paris Cafe",
      area: "Paris",
      category: "Cafe",
      address: "10 Rue de Rivoli, Paris, France",
      latitude: 48.8566,
      longitude: 2.3522,
      mapUrl: "https://maps.google.com/?cid=foreign",
      confidence: 0.9,
      matchReason: "게시물에서 확인했어요.",
    })).toMatchObject({
      name: "Paris",
      distanceMeters: null,
      isStation: false,
    });
  });
});

describe("Matpin global-place cache migrations", () => {
  const invalidationMigration = readFileSync(
    "supabase/migrations/20260811010000_invalidate_pre_global_place_cache.sql",
    "utf8",
  );
  const requeueMigration = readFileSync(
    "supabase/migrations/20260811010100_requeue_global_place_cache.sql",
    "utf8",
  );

  it("makes pre-global cache invalidation safe to rerun", () => {
    expect(invalidationMigration).toContain("where media_key not like 'global-place-types-v1:%'");
    expect(invalidationMigration).toContain("and invalidated_at is null");
    expect(invalidationMigration).not.toContain("drop table");
  });

  it("replaces reprocessing RPCs without dropping grants and invalidates both cache namespaces", () => {
    expect(requeueMigration).toContain("create or replace function public.matpin_requeue_failed_message");
    expect(requeueMigration).toContain("where media_key in (v_reel_id, 'global-place-types-v1:' || v_reel_id)");
    expect(requeueMigration).toContain("revoke all on function public.matpin_requeue_failed_message(uuid, text)");
    expect(requeueMigration).toContain("grant execute on function public.matpin_requeue_failed_message(uuid, text)");
    expect(requeueMigration).not.toContain("drop function");
  });
});
