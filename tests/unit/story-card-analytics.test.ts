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

describe("랜덤 엔딩 로컬 계측", () => {
  it("records only product-local IDs and funnel counters", () => {
    trackStoryCardEvent("choice_made", {
      cardId: "rain-station",
      choiceId: "observe",
      drawNumber: 2,
      turn: 4,
    });

    const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<Record<string, unknown>>;
    expect(events[0]).toMatchObject({
      event: "story_card_choice_made",
      event_type: "story_card_choice_made",
      entry_path: "/story-cards",
      card_id: "rain-station",
      choice_id: "observe",
      draw_number: 2,
      turn: 4,
    });
  });

  it("drops free-form story copy even if an untyped caller passes it", () => {
    const unsafeCall = trackStoryCardEvent as (
      event: "choice_made",
      params: Record<string, unknown>,
    ) => void;
    unsafeCall("choice_made", {
      cardId: "wave-archive",
      turn: 2,
      passage: "사용자가 쓴 비공개 문장",
      errorMessage: "서버 원문",
    });

    const stored = localStorage.getItem("events") ?? "";
    expect(stored).toContain("wave-archive");
    expect(stored).not.toContain("사용자가 쓴 비공개 문장");
    expect(stored).not.toContain("서버 원문");
  });
});
