import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/lib/backend/client", () => ({
  getSupabase: getSupabaseMock,
}));

import { castVote, fetchVotes } from "../../src/lib/backend/votes";
import { addVote, hasVoted, loadVotes, type Vote } from "../../src/lib/storage";

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, String(value));
  }
}

const votesKey = (slug: string): string => `oneul:votes:${slug}`;
const votedKey = (slug: string): string => `oneul:voted:${slug}`;

const seedLocalVote = (slug: string): Vote => {
  const vote: Vote = {
    id: "local-vote",
    type: "watch",
    comment: "로컬에 남은 응원",
    at: 1_725_000_000_000,
  };
  localStorage.setItem(votesKey(slug), JSON.stringify([vote]));
  return vote;
};

const mockFetchQuery = (order: ReturnType<typeof vi.fn>) => {
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  getSupabaseMock.mockReturnValue({ from });
  return { from, select, eq, order };
};

describe("backend vote storage boundary", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "generated-id") });
    getSupabaseMock.mockReset();
  });

  describe("fetchVotes", () => {
    it("uses localStorage when Supabase is unavailable", async () => {
      const slug = "local-only";
      const localVote = seedLocalVote(slug);
      getSupabaseMock.mockReturnValue(null);

      await expect(fetchVotes(slug)).resolves.toEqual([localVote]);
    });

    it("treats malformed or non-array localStorage data as an empty vote list", async () => {
      const slug = "broken-local-data";
      getSupabaseMock.mockReturnValue(null);

      localStorage.setItem(votesKey(slug), "{not-json");
      await expect(fetchVotes(slug)).resolves.toEqual([]);

      localStorage.setItem(votesKey(slug), JSON.stringify({ type: "need" }));
      await expect(fetchVotes(slug)).resolves.toEqual([]);
    });

    it("maps Supabase rows, preserves string ids, and excludes the current voter fingerprint", async () => {
      const slug = "shared-card";
      localStorage.setItem("oneul:fp", "my-fingerprint");
      const order = vi.fn().mockResolvedValue({
        data: [
          {
            id: "own-vote",
            kind: "cheer",
            comment: "내 응원",
            created_at: "2026-07-12T08:00:00.000Z",
            voter_fp: "my-fingerprint",
          },
          {
            id: "remote-vote",
            kind: "need",
            comment: "꼭 필요해요",
            created_at: "2026-07-12T09:30:00.000Z",
            voter_fp: "another-fingerprint",
          },
          {
            id: 42,
            kind: "watch",
            comment: null,
            created_at: "2026-07-12T10:00:00.000Z",
            voter_fp: "third-fingerprint",
          },
        ],
        error: null,
      });
      const query = mockFetchQuery(order);

      await expect(fetchVotes(slug)).resolves.toEqual([
        {
          id: "remote-vote",
          type: "need",
          comment: "꼭 필요해요",
          at: Date.parse("2026-07-12T09:30:00.000Z"),
        },
        {
          id: undefined,
          type: "watch",
          comment: undefined,
          at: Date.parse("2026-07-12T10:00:00.000Z"),
        },
      ]);
      expect(query.from).toHaveBeenCalledWith("card_votes");
      expect(query.select).toHaveBeenCalledWith("id,kind,comment,created_at,voter_fp");
      expect(query.eq).toHaveBeenCalledWith("slug", slug);
      expect(query.order).toHaveBeenCalledWith("created_at", { ascending: true });
    });

    it.each(["error", "null data", "throw"] as const)(
      "falls back to localStorage on Supabase %s",
      async (failure) => {
        const slug = `fallback-${failure}`;
        const localVote = seedLocalVote(slug);
        const order = vi.fn();
        if (failure === "error") {
          order.mockResolvedValue({ data: [], error: { message: "query failed" } });
        } else if (failure === "null data") {
          order.mockResolvedValue({ data: null, error: null });
        } else {
          order.mockRejectedValue(new Error("network failed"));
        }
        mockFetchQuery(order);

        await expect(fetchVotes(slug)).resolves.toEqual([localVote]);
      },
    );
  });

  describe("castVote", () => {
    it("writes the optimistic local vote before the Supabase upsert completes", async () => {
      const slug = "optimistic-card";
      const randomUUID = vi
        .fn()
        .mockReturnValueOnce("local-vote-id")
        .mockReturnValueOnce("voter-fingerprint");
      vi.stubGlobal("crypto", { randomUUID });
      vi.spyOn(Date, "now").mockReturnValue(1_725_000_123_456);

      let finishUpsert: (value: { error: null }) => void = () => undefined;
      const pendingUpsert = new Promise<{ error: null }>((resolve) => {
        finishUpsert = resolve;
      });
      const upsert = vi.fn().mockReturnValue(pendingUpsert);
      const from = vi.fn().mockReturnValue({ upsert });
      getSupabaseMock.mockReturnValue({ from });

      const casting = castVote(slug, "notify", "출시하면 알려주세요");

      expect(loadVotes(slug)).toEqual([
        {
          id: "local-vote-id",
          type: "notify",
          comment: "출시하면 알려주세요",
          at: 1_725_000_123_456,
        },
      ]);
      expect(hasVoted(slug)).toBe(true);
      expect(localStorage.getItem("oneul:fp")).toBe("voter-fingerprint");
      expect(from).toHaveBeenCalledWith("card_votes");
      expect(upsert).toHaveBeenCalledWith(
        {
          slug,
          kind: "notify",
          comment: "출시하면 알려주세요",
          voter_fp: "voter-fingerprint",
        },
        { onConflict: "slug,voter_fp", ignoreDuplicates: true },
      );

      finishUpsert({ error: null });
      await casting;
    });
  });

  describe("hasVoted and duplicate prevention", () => {
    it("returns true only for the JSON boolean true", () => {
      const slug = "strict-marker";
      const key = votedKey(slug);

      expect(hasVoted(slug)).toBe(false);
      for (const raw of [JSON.stringify("true"), JSON.stringify(1), JSON.stringify({}), "{broken"]) {
        localStorage.setItem(key, raw);
        expect(hasVoted(slug)).toBe(false);
      }

      localStorage.setItem(key, JSON.stringify(true));
      expect(hasVoted(slug)).toBe(true);
    });

    it("keeps the first local vote when the same browser votes again", () => {
      const slug = "one-browser-one-vote";
      const first: Vote = { id: "first", type: "need", at: 100 };
      const duplicate: Vote = { id: "duplicate", type: "cheer", at: 200 };

      addVote(slug, first);
      addVote(slug, duplicate);

      expect(hasVoted(slug)).toBe(true);
      expect(loadVotes(slug)).toEqual([first]);
    });
  });
});
