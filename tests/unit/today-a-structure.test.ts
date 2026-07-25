import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/today-a/structure/route";

const validRequest = {
  customer: "small_business",
  strength: "operations",
  weeklyTime: "half_day",
  problem: "여러 채널의 문의를 놓쳐 답변과 예약이 늦어져요.",
};

describe("POST /api/today-a/structure", () => {
  it("감사 통과 원본에서 사업 구조 하나만 반환한다", async () => {
    const response = await POST(new Request("https://example.com/api/today-a/structure", {
      method: "POST",
      body: JSON.stringify(validRequest),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.mode).toBe("catalog_snapshot");
    expect(body.result).toEqual(expect.objectContaining({
      id: expect.any(String),
      title: expect.any(String),
      structure: expect.objectContaining({
        payer: expect.any(String),
        needMoment: expect.any(String),
        input: expect.any(String),
        process: expect.any(String),
        output: expect.any(String),
        firstOffer: expect.any(String),
      }),
      evidence: expect.objectContaining({
        sourceName: expect.any(String),
        sourceUrl: expect.stringMatching(/^https:\/\//),
        snapshotNotice: expect.stringContaining("실시간"),
      }),
    }));
    expect(Array.isArray(body.result)).toBe(false);
  });

  it("불편 설명이 짧으면 가짜 기본 결과 대신 요청을 거절한다", async () => {
    const response = await POST(new Request("https://example.com/api/today-a/structure", {
      method: "POST",
      body: JSON.stringify({ ...validRequest, problem: "불편해요" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
});
