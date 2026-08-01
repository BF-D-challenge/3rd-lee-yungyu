import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/matpick/dm/route";
import {
  matpickDmResponseSchema,
  normalizeInstagramReelUrl,
} from "@/lib/matpick-dm-contract";

describe("normalizeInstagramReelUrl", () => {
  it("공개 Instagram Reel URL만 정규화한다", () => {
    expect(normalizeInstagramReelUrl(
      "https://www.instagram.com/reel/DbTBhcZNY1b/?igsh=test",
    )).toBe("https://www.instagram.com/reel/DbTBhcZNY1b/");
    expect(normalizeInstagramReelUrl("https://instagram.com/reel/DbTBhcZNY1b"))
      .toBe("https://www.instagram.com/reel/DbTBhcZNY1b/");
    expect(normalizeInstagramReelUrl("https://www.instagram.com/p/DbTBhcZNY1b/")).toBeNull();
    expect(normalizeInstagramReelUrl("http://www.instagram.com/reel/DbTBhcZNY1b/")).toBeNull();
    expect(normalizeInstagramReelUrl("https://evil.example/reel/DbTBhcZNY1b/")).toBeNull();
  });
});

describe("POST /api/matpick/dm", () => {
  it("알려진 릴스의 실제 장소를 첫 후보로 제시하고 Mock임을 명시한다", async () => {
    const response = await POST(new Request("http://localhost/api/matpick/dm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
      }),
    }));
    const body = matpickDmResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.mode).toBe("mock");
    expect(body.source).toBe("instagram_dm");
    expect(body.sender.scopedId).toBe("device-demo-user");
    expect(body.candidates[0]).toEqual(expect.objectContaining({
      id: "yeoksam-sanjang",
      name: "산장장작구이",
      confidence: 0.96,
    }));
    expect(body.notice).toContain("실제 Instagram DM을 읽지 않는");
  });

  it("게시물이나 타사 URL은 후보를 만들지 않고 거절한다", async () => {
    const response = await POST(new Request("http://localhost/api/matpick/dm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reelUrl: "https://www.instagram.com/p/DbTBhcZNY1b/",
      }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "unsupported_reel_url",
      message: "instagram.com/reel/로 시작하는 공개 릴스 링크를 넣어주세요.",
    });
  });
});
