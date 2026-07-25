import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  getUser: vi.fn(),
  localAddPublished: vi.fn(),
  localLoadPublished: vi.fn(),
}));

vi.mock("@/lib/backend/client", () => ({
  getSupabase: api.getSupabase,
}));

vi.mock("@/lib/backend/auth", () => ({
  getUser: api.getUser,
}));

vi.mock("@/lib/storage", () => ({
  addPublished: api.localAddPublished,
  loadPublished: api.localLoadPublished,
}));

import {
  fetchPublished,
  syncLocalPublishedCardsToAccount,
  type PublishedCard,
} from "@/lib/backend/published";

const localCard: PublishedCard = {
  slug: "local-card",
  payload: {
    seedId: "seed-1",
    seedLabel: "회의",
    track: "know",
    painId: 1,
    formatId: "f01",
    title: "결정 메모",
    oneliner: "결정만 남겨요",
    target: "작은 팀",
    situation: "회의 직후",
    psych: "결정을 놓치기 싫음",
  },
  feedbackReadToken: "owner-read-token",
  publishedAt: Date.parse("2026-07-20T00:00:00.000Z"),
};

describe("published card account sync", () => {
  beforeEach(() => {
    api.getSupabase.mockReset();
    api.getUser.mockReset();
    api.localAddPublished.mockReset();
    api.localLoadPublished.mockReset();
    api.localLoadPublished.mockReturnValue([localCard]);
  });

  it("does not touch the database before a verified user exists", async () => {
    const from = vi.fn();
    api.getSupabase.mockReturnValue({ from });
    api.getUser.mockResolvedValue(null);

    await expect(syncLocalPublishedCardsToAccount()).resolves.toEqual({
      status: "anonymous",
      count: 0,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("upserts this device's cards under only the verified auth user ID", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    api.getSupabase.mockReturnValue({ from });
    api.getUser.mockResolvedValue({ id: "verified-user-id" });

    await expect(syncLocalPublishedCardsToAccount()).resolves.toEqual({
      status: "synced",
      count: 1,
    });
    expect(from).toHaveBeenCalledWith("published_cards");
    expect(upsert).toHaveBeenCalledWith([
      {
        user_id: "verified-user-id",
        slug: "local-card",
        payload: localCard.payload,
        feedback_read_token: "owner-read-token",
        published_at: "2026-07-20T00:00:00.000Z",
      },
    ], {
      onConflict: "user_id,slug",
    });
  });

  it("keeps the current local card visible when the account also has remote cards", async () => {
    const remoteCard = {
      slug: "remote-card",
      payload: { ...localCard.payload, title: "다른 기기 카드" },
      feedback_read_token: null,
      published_at: "2026-07-19T00:00:00.000Z",
    };
    const order = vi.fn().mockResolvedValue({ data: [remoteCard], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    api.getSupabase.mockReturnValue({ from });
    api.getUser.mockResolvedValue({ id: "verified-user-id" });

    await expect(fetchPublished()).resolves.toEqual([
      localCard,
      {
        slug: "remote-card",
        payload: remoteCard.payload,
        publishedAt: Date.parse(remoteCard.published_at),
      },
    ]);
  });
});
