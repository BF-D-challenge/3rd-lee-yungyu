import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@supabase/supabase-js")>();
  return { ...original, createClient: mocks.createClient };
});

import {
  claimMatpinMediaAnalysis,
  completeMatpinMediaAnalysis,
  releaseMatpinMediaAnalysis,
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
const claimToken = "11111111-1111-4111-8111-111111111111";
const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260809174423_add_matpin_delivery_attempt_claims.sql",
), "utf8").toLowerCase();

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin media cache lease fencing", () => {
  it("returns a claim token only to the active owner and preserves hit/pending shapes", async () => {
    const rpc = vi.fn()
      .mockReturnValueOnce(request({
        data: { state: "owner", claimToken },
        error: null,
      }))
      .mockReturnValueOnce(request({ data: { state: "pending" }, error: null }))
      .mockReturnValueOnce(request({
        data: { state: "hit", outcome: "insufficient", candidates: [] },
        error: null,
      }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(claimMatpinMediaAnalysis(mediaKey)).resolves.toEqual({
      state: "owner",
      claimToken,
    });
    await expect(claimMatpinMediaAnalysis(mediaKey)).resolves.toEqual({ state: "pending" });
    await expect(claimMatpinMediaAnalysis(mediaKey)).resolves.toEqual({
      state: "hit",
      outcome: "insufficient",
      candidates: [],
    });
  });

  it("passes the same owner token to complete and release mutations", async () => {
    const rpc = vi.fn()
      .mockReturnValueOnce(request({ data: null, error: null }))
      .mockReturnValueOnce(request({ data: null, error: null }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(completeMatpinMediaAnalysis({
      mediaKey,
      claimToken,
      outcome: "insufficient",
      candidates: [],
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
    await expect(releaseMatpinMediaAnalysis(mediaKey, claimToken)).resolves.toBeUndefined();

    expect(rpc).toHaveBeenNthCalledWith(1, "matpin_complete_media_analysis", expect.objectContaining({
      p_media_key: mediaKey,
      p_claim_token: claimToken,
      p_outcome: "insufficient",
    }));
    expect(rpc).toHaveBeenNthCalledWith(2, "matpin_release_media_analysis", {
      p_media_key: mediaKey,
      p_claim_token: claimToken,
    });
  });

  it("surfaces a stale-token rejection instead of treating it as success", async () => {
    const rpc = vi.fn()
      .mockReturnValueOnce(request({
        data: null,
        error: { message: "matpin_cache_claim_mismatch" },
      }))
      .mockReturnValueOnce(request({
        data: null,
        error: { message: "matpin_cache_claim_mismatch" },
      }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(completeMatpinMediaAnalysis({
      mediaKey,
      claimToken,
      outcome: "insufficient",
      candidates: [],
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
    })).rejects.toThrow("matpin_cache_complete_failed:matpin_cache_claim_mismatch");
    await expect(releaseMatpinMediaAnalysis(mediaKey, claimToken))
      .rejects.toThrow("matpin_cache_release_failed:matpin_cache_claim_mismatch");
  });

  it("fences stale owner A after owner B takes over the 300 second lease", () => {
    const claimStart = migration.indexOf("create or replace function public.matpin_claim_media_analysis");
    const completeStart = migration.indexOf("create function public.matpin_complete_media_analysis");
    const releaseStart = migration.indexOf("create function public.matpin_release_media_analysis");
    const aclStart = migration.indexOf("revoke all on function public.matpin_claim_media_analysis");
    const claimSql = migration.slice(claimStart, completeStart);
    const completeSql = migration.slice(completeStart, releaseStart);
    const releaseSql = migration.slice(releaseStart, aclStart);

    expect(migration).toContain("add column claim_token uuid");
    expect(migration).toContain("add column completed_claim_token uuid");
    expect(claimSql.match(/interval '300 seconds'/g)).toHaveLength(2);
    expect(claimSql).toContain("'claimtoken', v_claim_token");
    expect(completeSql).toContain("v_cache.completed_claim_token = p_claim_token");
    expect(completeSql).toContain("v_cache.claim_token is distinct from p_claim_token");
    expect(completeSql).toContain("v_cache.lease_expires_at <= now()");
    expect(releaseSql).toContain("v_cache.claim_token is distinct from p_claim_token");
    expect(releaseSql).toContain("v_cache.lease_expires_at <= now()");
    expect(releaseSql).toContain("raise exception 'matpin_cache_claim_mismatch'");
    expect(releaseSql).toContain("delete from public.matpin_media_analysis_cache");
  });
});
