import { describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/story-cards/route";
import {
  isStoryEnding,
  type StoryCardRequest,
  type StoryCardResponse,
  type StoryCardSession,
} from "../../src/lib/story-card-contract";

async function post(body: unknown): Promise<{ response: Response; payload: StoryCardResponse }> {
  const response = await POST(new Request("https://example.com/api/story-cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  return {
    response,
    payload: await response.json() as StoryCardResponse,
  };
}

describe("랜덤 엔딩 API", () => {
  it("draws one honest mock card without an auth or payment prerequisite", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { response, payload } = await post({ action: "draw" } satisfies StoryCardRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toMatchObject({
      mode: "mock",
      cardId: "rain-station",
      turn: 1,
      totalTurns: 8,
      choiceHistory: [],
    });
    expect(JSON.stringify(payload)).not.toMatch(/login|auth|payment|price|referral/i);
  });

  it("keeps a new free draw random while excluding only the immediately previous card", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { payload } = await post({
      action: "draw",
      excludeCardId: "rain-station",
    } satisfies StoryCardRequest);

    expect(payload.cardId).toBe("glass-greenhouse");
  });

  it("returns the visible ending only after exactly eight choices", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    let { payload } = await post({ action: "draw" } satisfies StoryCardRequest);

    for (let choiceNumber = 1; choiceNumber <= 8; choiceNumber += 1) {
      expect(isStoryEnding(payload)).toBe(false);
      const session = payload as StoryCardSession;
      ({ payload } = await post({
        action: "choose",
        session,
        choiceId: choiceNumber % 3 === 0 ? "answer" : "observe",
      } satisfies StoryCardRequest));
    }

    expect(isStoryEnding(payload)).toBe(true);
    if (!isStoryEnding(payload)) throw new Error("ending_expected");
    expect(payload.choiceHistory).toHaveLength(8);
    expect(payload.endingTitle).toBe("끝까지 단서를 본 사람");
    expect(payload.ending.length).toBeGreaterThan(40);
  });

  it("rejects a fabricated card or choice history instead of reflecting client copy", async () => {
    const { response } = await post({
      action: "choose",
      session: {
        sessionId: "fake-session",
        cardId: "fabricated-card",
        turn: 2,
        choiceHistory: [],
      },
      choiceId: "observe",
    });

    expect(response.status).toBe(400);
  });
});
