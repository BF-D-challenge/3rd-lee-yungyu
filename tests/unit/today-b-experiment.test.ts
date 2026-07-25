import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/today-b/experiment/route";

const validRequest = {
  idea: "고객 문의 답변 초안을 만드는 작은 도구",
  customer: "혼자 쇼핑몰을 운영하는 사람",
  promise: "문의 10개의 답변 초안을 5분 안에 받기",
  channel: "direct",
  signal: "deposit",
};

describe("POST /api/today-b/experiment", () => {
  it("한 위험 가정과 정확히 7일의 행동 실험을 반환한다", async () => {
    const response = await POST(new Request("https://example.com/api/today-b/experiment", {
      method: "POST",
      body: JSON.stringify(validRequest),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.mode).toBe("rule_based_mock");
    expect(body.risk).toEqual({
      label: "지불 의향",
      assumption: expect.stringContaining("환불 가능한 예약금 결제"),
      reason: expect.any(String),
    });
    expect(body.experiment.days).toHaveLength(7);
    expect(body.experiment.days.map((day: { day: number }) => day.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(body.experiment.targetCount).toBe(15);
    expect(body.experiment.passCount).toBe(2);
    expect(body.notice).toContain("실제 수요나 성공을 예측하지 않습니다");
  });

  it("필수 고객 정보가 없으면 실험을 만들지 않는다", async () => {
    const response = await POST(new Request("https://example.com/api/today-b/experiment", {
      method: "POST",
      body: JSON.stringify({ ...validRequest, customer: "" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
});
