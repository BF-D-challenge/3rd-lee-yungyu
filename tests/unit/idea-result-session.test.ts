import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearIdeaResultSession,
  consumeIdeaResultLoginPending,
  loadIdeaResultSession,
  markIdeaResultLoginPending,
  saveIdeaResultSession,
} from "@/lib/idea-result-session";

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

describe("Idea result OAuth handoff", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", new MemoryStorage());
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  it("keeps only option IDs needed to restore the current result on this device", () => {
    saveIdeaResultSession({
      scenarioId: "scenario-voice-decision",
      payerId: "small-team-pm",
      momentId: "after-meeting",
      twistId: "decisions-only",
      savedAt: 1_000,
    });

    sessionStorage.clear();
    expect(loadIdeaResultSession()).toEqual({
      v: 1,
      scenarioId: "scenario-voice-decision",
      payerId: "small-team-pm",
      momentId: "after-meeting",
      twistId: "decisions-only",
      savedAt: 1_000,
    });
  });

  it("attributes a login after a result once without clearing the restorable result", () => {
    saveIdeaResultSession({
      scenarioId: "scenario-voice-decision",
      payerId: "small-team-pm",
      momentId: "after-meeting",
      twistId: "decisions-only",
      savedAt: 1_000,
    });

    expect(markIdeaResultLoginPending()).toBe(true);
    // OAuth 복귀 뒤 Idea Lab이 같은 결과를 복원하며 savedAt을 갱신해도 귀속은 유지한다.
    saveIdeaResultSession({
      scenarioId: "scenario-voice-decision",
      payerId: "small-team-pm",
      momentId: "after-meeting",
      twistId: "decisions-only",
      savedAt: 2_000,
    });
    expect(consumeIdeaResultLoginPending()?.scenarioId).toBe("scenario-voice-decision");
    expect(consumeIdeaResultLoginPending()).toBeNull();
    expect(loadIdeaResultSession()).toMatchObject({
      twistId: "decisions-only",
      savedAt: 2_000,
    });
  });

  it("rejects malformed storage and clears both result and pending state explicitly", () => {
    sessionStorage.setItem("oneul:idea-result-session:v1", JSON.stringify({
      v: 1,
      scenarioId: "",
      payerId: "payer",
      momentId: "moment",
      twistId: "twist",
      savedAt: 1_000,
    }));
    sessionStorage.setItem("oneul:idea-result-login-pending:v1", "1");
    localStorage.setItem("oneul:idea-result-device:v1", "not-json");

    expect(loadIdeaResultSession()).toBeNull();
    clearIdeaResultSession();
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
