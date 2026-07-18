import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedbackOwnerAccess } from "../../src/lib/feedback-access";

const api = vi.hoisted(() => ({
  configured: vi.fn(),
  readCardVotes: vi.fn(),
  readDuelVotes: vi.fn(),
  sendCardVote: vi.fn(),
  sendDuelVote: vi.fn(),
  updateCardComment: vi.fn(),
  updateDuelComment: vi.fn(),
}));

vi.mock("../../src/lib/backend/feedback-api", () => ({
  feedbackApiConfigured: api.configured,
  readCardVotes: api.readCardVotes,
  readDuelVotes: api.readDuelVotes,
  sendCardVote: api.sendCardVote,
  sendDuelVote: api.sendDuelVote,
  updateCardComment: api.updateCardComment,
  updateDuelComment: api.updateDuelComment,
}));

import { castVote, fetchVotes, voterFp } from "../../src/lib/backend/votes";
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

const access: FeedbackOwnerAccess = {
  requestId: `feedback_${"r".repeat(43)}`,
  writeToken: "w".repeat(43),
  readToken: "o".repeat(43),
};
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

describe("backend vote storage boundary", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "generated-id") });
    Object.values(api).forEach((mock) => mock.mockReset());
    api.configured.mockReturnValue(false);
    api.sendCardVote.mockResolvedValue("disabled");
  });

  describe("fetchVotes", () => {
    it("uses localStorage when no owner read capability is available", async () => {
      const slug = "local-only";
      const localVote = seedLocalVote(slug);

      await expect(fetchVotes(slug)).resolves.toEqual([localVote]);
      expect(api.readCardVotes).not.toHaveBeenCalled();
    });

    it("treats malformed or non-array localStorage data as an empty vote list", async () => {
      const slug = "broken-local-data";
      localStorage.setItem(votesKey(slug), "{not-json");
      await expect(fetchVotes(slug)).resolves.toEqual([]);

      localStorage.setItem(votesKey(slug), JSON.stringify({ type: "need" }));
      await expect(fetchVotes(slug)).resolves.toEqual([]);
    });

    it("reads sanitized Edge API rows with the owner token and excludes the current browser", async () => {
      const slug = "shared-card";
      const votes: Vote[] = [
        { id: "remote-vote", type: "need", comment: "꼭 필요해요", at: 1_783_848_600_000 },
        { type: "watch", at: 1_783_850_400_000 },
      ];
      localStorage.setItem("oneul:fp", "my-fingerprint");
      api.readCardVotes.mockResolvedValue({ status: "ok", data: { ok: true, votes } });

      await expect(fetchVotes(slug, access)).resolves.toEqual(votes);
      expect(api.readCardVotes).toHaveBeenCalledWith({
        requestId: access.requestId,
        readToken: access.readToken,
        excludeVoterToken: "my-fingerprint",
      });
    });

    it.each(["failed", "disabled"] as const)(
      "falls back to localStorage when the Edge API is %s",
      async (status) => {
        const slug = `fallback-${status}`;
        const localVote = seedLocalVote(slug);
        api.readCardVotes.mockResolvedValue({ status });

        await expect(fetchVotes(slug, access)).resolves.toEqual([localVote]);
      },
    );
  });

  describe("castVote", () => {
    it("keeps a local-only vote when the backend is intentionally disabled", async () => {
      await expect(castVote("local-card", "notify", "알려주세요")).resolves.toBe("local-only");
      expect(loadVotes("local-card")).toHaveLength(1);
      expect(api.sendCardVote).not.toHaveBeenCalled();
    });

    it("writes optimistically before the token-authenticated Edge request completes", async () => {
      const slug = "optimistic-card";
      const randomUUID = vi
        .fn()
        .mockReturnValueOnce("local-vote-id")
        .mockReturnValueOnce("voter-fingerprint");
      vi.stubGlobal("crypto", { randomUUID });
      vi.spyOn(Date, "now").mockReturnValue(1_725_000_123_456);

      let finishRequest: (value: "synced") => void = () => undefined;
      api.sendCardVote.mockReturnValue(new Promise<"synced">((resolve) => {
        finishRequest = resolve;
      }));

      const casting = castVote(slug, "notify", "출시하면 알려주세요", access);

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
      expect(api.sendCardVote).toHaveBeenCalledWith({
        access,
        voterToken: "voter-fingerprint",
        kind: "notify",
        comment: "출시하면 알려주세요",
      });

      finishRequest("synced");
      await expect(casting).resolves.toBe("synced");
    });

    it("rolls back the local success marker when the Edge request is denied", async () => {
      const slug = "remote-write-denied";
      api.sendCardVote.mockResolvedValue("failed");

      await expect(castVote(slug, "cheer", "다시 보낼 수 있어야 해요", access)).resolves.toBe("failed");
      expect(loadVotes(slug)).toEqual([]);
      expect(hasVoted(slug)).toBe(false);
    });

    it("rejects a legacy link in a configured production client", async () => {
      const slug = "legacy-link";
      api.configured.mockReturnValue(true);

      await expect(castVote(slug, "need")).resolves.toBe("failed");
      expect(loadVotes(slug)).toEqual([]);
      expect(hasVoted(slug)).toBe(false);
    });

    it("keeps a stable non-shared fingerprint in memory when localStorage is blocked", () => {
      const blockedStorage = {
        getItem: vi.fn(() => { throw new DOMException("blocked", "SecurityError"); }),
        setItem: vi.fn(() => { throw new DOMException("blocked", "SecurityError"); }),
      };
      vi.stubGlobal("localStorage", blockedStorage);

      const first = voterFp();
      const second = voterFp();

      expect(first).toBe(second);
      expect(first).not.toBe("anon");
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
