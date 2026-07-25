import { describe, expect, it } from "vitest";
import { GET, POST } from "../../src/app/api/story-cards/route";
import type {
  StoryCardRequest,
  StoryChatSession,
  StorySituationListResponse,
} from "../../src/lib/story-card-contract";

async function post(body: unknown): Promise<{ response: Response; payload: StoryChatSession }> {
  const response = await POST(new Request("https://example.com/api/story-cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  return {
    response,
    payload: await response.json() as StoryChatSession,
  };
}

describe("상황 카드 API", () => {
  it("returns an honest mock situation list through the API boundary", async () => {
    const response = await GET();
    const payload = await response.json() as StorySituationListResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.mode).toBe("mock");
    expect(payload.situations).toHaveLength(4);
    expect(payload.situations[0]).toMatchObject({
      id: "rain-station",
      title: "비가 멈춘 역",
      guideName: "마지막 열차의 기관사",
    });
  });

  it("starts the selected situation immediately without auth or payment fields", async () => {
    const { response, payload } = await post({
      action: "start",
      situationId: "glass-greenhouse",
    } satisfies StoryCardRequest);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      mode: "mock",
      situation: { id: "glass-greenhouse", title: "유리 온실의 편지" },
      messages: [{ role: "guide" }],
    });
    expect(payload.suggestedReplies).toHaveLength(2);
    expect(JSON.stringify(payload)).not.toMatch(/login|auth|payment|price|referral/i);
  });

  it("returns only the next guide message and never reflects the user's private copy", async () => {
    const { payload: started } = await post({
      action: "start",
      situationId: "wave-archive",
    } satisfies StoryCardRequest);

    const privateCopy = "이 문장은 응답이나 분석 로그에 복사하면 안 돼요";
    const { response, payload } = await post({
      action: "reply",
      sessionId: started.sessionId,
      situationId: "wave-archive",
      message: privateCopy,
      messageCount: 1,
    } satisfies StoryCardRequest);

    expect(response.status).toBe(200);
    expect(payload.sessionId).toBe(started.sessionId);
    expect(payload.messages).toEqual([expect.objectContaining({
      role: "guide",
      text: "그 말을 처음 품었던 때의 당신은 무엇을 바라고 있었나요?",
    })]);
    expect(JSON.stringify(payload)).not.toContain(privateCopy);
  });

  it("rejects fabricated situations, empty messages, and invalid message counts", async () => {
    const invalidSituation = await post({
      action: "start",
      situationId: "fabricated-card",
    });
    expect(invalidSituation.response.status).toBe(400);

    const emptyMessage = await post({
      action: "reply",
      sessionId: "safe-session",
      situationId: "rain-station",
      message: " ",
      messageCount: 1,
    });
    expect(emptyMessage.response.status).toBe(400);

    const invalidCount = await post({
      action: "reply",
      sessionId: "safe-session",
      situationId: "rain-station",
      message: "안녕하세요",
      messageCount: 51,
    });
    expect(invalidCount.response.status).toBe(400);
  });
});
