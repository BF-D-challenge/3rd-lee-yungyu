import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackStoryCardEvent } from "../../src/lib/story-card-analytics";

const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
};

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("sessionStorage", makeStorage());
  vi.stubGlobal("window", { location: { pathname: "/story-cards" } });
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
});

describe("상황 카드 로컬 계측", () => {
  it("records only the situation ID, stage, and bounded funnel count", () => {
    trackStoryCardEvent("message_sent", {
      cardId: "rain-station",
      stage: "reply",
      messageCount: 2,
    });

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events[0]).toMatchObject({
      event: "story_card_message_sent",
      event_type: "story_card_message_sent",
      entry_path: "/story-cards",
      card_id: "rain-station",
      stage: "reply",
      message_count: 2,
    });
  });

  it("drops free-form chat copy even when an untyped caller passes it", () => {
    const unsafeCall = trackStoryCardEvent as (
      event: "message_sent",
      params: Record<string, unknown>,
    ) => void;
    unsafeCall("message_sent", {
      cardId: "wave-archive",
      messageCount: 1,
      message: "사용자가 쓴 비공개 문장",
      errorMessage: "서버 원문",
    });

    const stored = localStorage.getItem("events") ?? "";
    expect(stored).toContain("wave-archive");
    expect(stored).not.toContain("사용자가 쓴 비공개 문장");
    expect(stored).not.toContain("서버 원문");
  });
});
