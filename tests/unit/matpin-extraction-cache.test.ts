import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@supabase/supabase-js")>();
  return { ...original, createClient: mocks.createClient };
});

import {
  claimMatpinMediaExtraction,
  completeMatpinMediaExtraction,
  releaseMatpinMediaExtraction,
} from "@/lib/matpin/store";

type QueryResult = { data: unknown; error: { message: string } | null };

function request(result: QueryResult) {
  const query = {} as PromiseLike<QueryResult> & {
    abortSignal: ReturnType<typeof vi.fn>;
  };
  query.abortSignal = vi.fn(() => query);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

const mediaKey = "DbTBhcZNY1b";
const version = "instagram-place-extraction-v1";
const claimToken = "11111111-1111-4111-8111-111111111111";
const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260819144359_add_matpin_extraction_cache.sql",
), "utf8").toLowerCase();

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin versioned extraction cache", () => {
  it("returns fenced owner, pending, and validated hit shapes", async () => {
    const analysis = {
      status: "insufficient",
      summary: "장소를 직접 확인하지 못했어요.",
      places: [],
    };
    const rpc = vi.fn()
      .mockReturnValueOnce(request({
        data: { state: "owner", claimToken },
        error: null,
      }))
      .mockReturnValueOnce(request({ data: { state: "pending" }, error: null }))
      .mockReturnValueOnce(request({ data: { state: "hit", analysis }, error: null }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(claimMatpinMediaExtraction(mediaKey, version)).resolves.toEqual({
      state: "owner",
      claimToken,
    });
    await expect(claimMatpinMediaExtraction(mediaKey, version)).resolves.toEqual({
      state: "pending",
    });
    await expect(claimMatpinMediaExtraction(mediaKey, version)).resolves.toEqual({
      state: "hit",
      analysis,
    });
  });

  it("passes the same version and owner token to complete and release", async () => {
    const rpc = vi.fn()
      .mockReturnValueOnce(request({ data: null, error: null }))
      .mockReturnValueOnce(request({ data: null, error: null }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(completeMatpinMediaExtraction({
      mediaKey,
      extractionVersion: version,
      claimToken,
      analysis: {
        status: "insufficient",
        summary: "장소를 직접 확인하지 못했어요.",
        places: [],
      },
      metrics: {
        model: "gemini-test",
        durationMs: 100,
        requestCount: 1,
        mediaBytes: 1_024,
        inputTokens: 100,
        outputTokens: 20,
        thoughtTokens: 10,
        toolUseTokens: 0,
        totalTokens: 120,
      },
    })).resolves.toBeUndefined();
    await expect(releaseMatpinMediaExtraction(
      mediaKey,
      version,
      claimToken,
    )).resolves.toBeUndefined();

    expect(rpc).toHaveBeenNthCalledWith(1, "matpin_complete_media_extraction", expect.objectContaining({
      p_media_key: mediaKey,
      p_extraction_version: version,
      p_claim_token: claimToken,
      p_analysis_model: "gemini-test",
    }));
    expect(rpc).toHaveBeenNthCalledWith(2, "matpin_release_media_extraction", {
      p_media_key: mediaKey,
      p_extraction_version: version,
      p_claim_token: claimToken,
    });
  });

  it("keeps private data out and fences the 30-day reusable result", () => {
    expect(migration).toContain("primary key (media_key, extraction_version)");
    expect(migration).toContain("interval '300 seconds'");
    expect(migration).toContain("interval '30 days'");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("matpin_extraction_cache_claim_mismatch");
    expect(migration).toContain("completed_claim_token = p_claim_token");
    expect(migration).toContain("never stores sender ids, message ids, private links, or signed media urls");
    expect(migration).not.toContain("sender_hash");
    expect(migration).not.toContain("message_id");
    expect(migration).not.toContain("media_url");
  });
});
