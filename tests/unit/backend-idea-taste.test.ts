import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IdeaTasteAnswer } from "@/lib/idea-taste";

const api = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSupabase: vi.fn(),
}));

vi.mock("@/lib/backend/auth", () => ({
  getUser: api.getUser,
}));

vi.mock("@/lib/backend/client", () => ({
  getSupabase: api.getSupabase,
}));

import {
  loadRememberedIdeaTasteAnswers,
  rememberIdeaTasteAnswer,
} from "@/lib/backend/idea-taste";

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }

  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }

  key(index: number) {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.entries.delete(key);
  }

  setItem(key: string, value: string) {
    this.entries.set(key, String(value));
  }
}

const answer: IdeaTasteAnswer = {
  id: "00000000-0000-4000-8000-000000000001",
  questionId: "audience",
  answerId: "personal",
  traitId: "audience:personal",
  createdAt: "2026-07-18T00:00:00.000Z",
};

describe("Idea Lab taste persistence boundary", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("localStorage", storage);
    api.getUser.mockReset();
    api.getSupabase.mockReset();
    api.getUser.mockResolvedValue(null);
    api.getSupabase.mockReturnValue(null);
  });

  it("keeps an anonymous answer on this device without calling the database", async () => {
    await expect(rememberIdeaTasteAnswer(answer)).resolves.toBe("local");
    expect(api.getSupabase).not.toHaveBeenCalled();
    await expect(loadRememberedIdeaTasteAnswers()).resolves.toEqual([answer]);
  });

  it("writes only abstract answer IDs under the authenticated user's ID", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    api.getUser.mockResolvedValue({ id: "user-1" });
    api.getSupabase.mockReturnValue({ from });

    await expect(rememberIdeaTasteAnswer(answer)).resolves.toBe("database");
    expect(from).toHaveBeenCalledWith("idea_taste_answers");
    expect(upsert).toHaveBeenCalledWith([
      {
        id: answer.id,
        user_id: "user-1",
        question_id: "audience",
        answer_id: "personal",
        trait_id: "audience:personal",
      },
    ], {
      onConflict: "id",
      ignoreDuplicates: true,
    });
  });

  it("claims a prior anonymous answer on login, syncs it, and reads only that user", async () => {
    await rememberIdeaTasteAnswer(answer);

    const upsert = vi.fn().mockResolvedValue({ error: null });
    const limit = vi.fn().mockResolvedValue({
      data: [{
        id: answer.id,
        question_id: answer.questionId,
        answer_id: answer.answerId,
        trait_id: answer.traitId,
        created_at: answer.createdAt,
      }],
      error: null,
    });
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ upsert, select }));
    api.getUser.mockResolvedValue({ id: "user-1" });
    api.getSupabase.mockReturnValue({ from });

    await expect(loadRememberedIdeaTasteAnswers()).resolves.toEqual([answer]);
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ user_id: "user-1", question_id: "audience" })],
      expect.any(Object),
    );
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
