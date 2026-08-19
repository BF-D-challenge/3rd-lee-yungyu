import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { matpinSavedPlaceSchema } from "@/lib/matpin/contract";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@supabase/supabase-js")>();
  return { ...original, createClient: mocks.createClient };
});

import { saveMatpinPlaces } from "@/lib/matpin/store";

type QueryResult = { data: unknown; error: { message: string } | null };

function request(result: QueryResult) {
  const query = {} as PromiseLike<QueryResult>;
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260819145426_add_matpin_operator_verified_source.sql",
), "utf8").toLowerCase();

const candidate = {
  id: "operator:place-1",
  name: "검증한 장소",
  placeType: "restaurant" as const,
  countryCode: "KR",
  regionName: "서울특별시 마포구",
  area: "망원동",
  category: "음식점",
  address: "서울 마포구 성미산로 71 1층",
  latitude: 37.56,
  longitude: 126.92,
  mapUrl: "https://www.google.com/maps/search/?api=1&query=verified",
  confidence: 0.99,
  matchReason: "운영 복구에서 공개 게시물의 상호와 주소를 확인했어요.",
};

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin operator-verified recovery", () => {
  it("keeps the recovery source explicit in the public contract", () => {
    expect(matpinSavedPlaceSchema.parse({
      id: 1,
      messageId: "11111111-1111-4111-8111-111111111111",
      reelId: "Post_123",
      reelUrl: "https://www.instagram.com/p/Post_123/",
      place: candidate,
      confirmationSource: "operator_verified",
      savedAt: "2026-08-19T10:00:00.000Z",
    }).confirmationSource).toBe("operator_verified");
  });

  it("passes the explicit source through the service-role save RPC", async () => {
    const rpc = vi.fn(() => request({ data: 1, error: null }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(saveMatpinPlaces({
      messageId: "11111111-1111-4111-8111-111111111111",
      senderHash: "a".repeat(64),
      candidates: [candidate],
      confirmationSource: "operator_verified",
    })).resolves.toBe(1);

    expect(rpc).toHaveBeenCalledWith("matpin_save_places", expect.objectContaining({
      p_confirmation_source: "operator_verified",
    }));
  });

  it("updates only the existing recovery RPC and preserves its service-role boundary", () => {
    expect(migration).toContain("'operator_verified'");
    expect(migration).toContain("create or replace function public.matpin_save_places");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("revoke all on function public.matpin_save_places");
    expect(migration).toContain("grant execute on function public.matpin_save_places");
    expect(migration).toContain("candidates = p_places");
    expect(migration).toContain("last_error = null");
  });
});
