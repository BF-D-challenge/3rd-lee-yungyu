import { afterEach, describe, expect, it, vi } from "vitest";
const enqueueTodayApplication = vi.hoisted(() => vi.fn());

vi.mock("@/lib/today-server", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/today-server")>(),
  enqueueTodayApplication,
}));

import { POST as createIdea } from "@/app/api/today/idea/route";
import { POST as createApplication } from "@/app/api/today/applications/route";
import { buildTodayArtifacts } from "@/lib/today-artifacts";
import { buildCatalogTodayIdea } from "@/lib/today-idea";

afterEach(() => {
  vi.unstubAllEnvs();
  enqueueTodayApplication.mockReset();
});

describe("Today 통합 아이디어와 1일 제작 계약", () => {
  it("기존 아이디어를 저장된 매출 원본 구조와 연결하고 핵심 입력을 버리지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E", "1");
    const idea = "인스타그램 맛집 영상을 저장하면 가까운 순서로 지도에서 보여주는 서비스";
    const response = await createIdea(new Request("https://example.com/api/today/idea", {
      method: "POST",
      body: JSON.stringify({ path: "existing", idea }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("catalog_snapshot");
    expect(body.result.oneLiner).toContain(idea);
    expect(body.result.evidence).toEqual(expect.objectContaining({
      sourceName: expect.any(String),
      sourceUrl: expect.stringMatching(/^https:\/\//),
      snapshotNotice: expect.stringContaining("보증하지"),
    }));
    expect(body.result.productionScope.landingSections).toHaveLength(3);
  });

  it("아이디어가 없으면 세 선택으로 원본 구조를 한 개 제안한다", () => {
    const result = buildCatalogTodayIdea({
      path: "guided",
      idea: "",
      answers: {
        customer: "solo_business",
        moment: "missed_sales",
        strength: "talk",
      },
    });
    expect(result.customer).toContain("사업자");
    expect(result.problem).toContain("고객");
    expect(result.mechanism).toEqual(expect.objectContaining({
      input: expect.any(String),
      process: expect.any(String),
      output: expect.any(String),
    }));
  });

  it("제작 신청은 서버 큐의 24시간 작업과 전용 접근 토큰을 반환한다", async () => {
    const idea = buildCatalogTodayIdea({
      path: "guided",
      idea: "",
      answers: {
        customer: "team",
        moment: "repetitive_work",
        strength: "organize",
      },
    });
    const submittedAt = new Date("2026-07-29T00:00:00.000Z");
    const readyAt = new Date("2026-07-30T00:00:00.000Z");
    enqueueTodayApplication.mockResolvedValue({
      accessToken: "server-access-token-longer-than-24",
      job: {
        id: "00ce0139-6d09-4bd9-9c72-3ecce16a081d",
        submittedAt: submittedAt.toISOString(),
        readyAt: readyAt.toISOString(),
        status: "queued",
        maskedEmail: "he***@example.com",
        idea,
        channel: "instagram",
        signal: "waitlist",
        artifacts: null,
        emailedAt: null,
        attemptCount: 0,
        notice: "완료되면 입력한 이메일로 전용 결과 링크를 보내드려요.",
      },
    });

    const response = await createApplication(new Request("https://example.com/api/today/applications", {
      method: "POST",
      body: JSON.stringify({
        idea,
        email: "hello@example.com",
        channel: "instagram",
        signal: "waitlist",
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.mode).toBe("server_queue");
    expect(new Date(body.job.readyAt).getTime() - new Date(body.job.submittedAt).getTime())
      .toBe(24 * 60 * 60 * 1_000);
    expect(body.job.maskedEmail).toBe("he***@example.com");
    expect(body.job.artifacts).toBeNull();
    expect(body.accessToken).toBe("server-access-token-longer-than-24");
    expect(buildTodayArtifacts(idea, "instagram", "waitlist")).toEqual(expect.objectContaining({
      ad: expect.objectContaining({ headline: expect.any(String) }),
      landing: expect.objectContaining({ cta: "대기 신청" }),
      testPlan: expect.objectContaining({ target: 40, pass: 8 }),
    }));
    expect(enqueueTodayApplication).toHaveBeenCalledWith(expect.objectContaining({
      email: "hello@example.com",
      channel: "instagram",
      signal: "waitlist",
    }));
  });

  it("짧은 기존 아이디어와 잘못된 이메일을 거절한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E", "1");
    const ideaResponse = await createIdea(new Request("https://example.com/api/today/idea", {
      method: "POST",
      body: JSON.stringify({ path: "existing", idea: "맛집 앱" }),
    }));
    expect(ideaResponse.status).toBe(400);

    const idea = buildCatalogTodayIdea({
      path: "guided",
      idea: "",
      answers: {
        customer: "consumer",
        moment: "scattered_info",
        strength: "build",
      },
    });
    const applicationResponse = await createApplication(new Request("https://example.com/api/today/applications", {
      method: "POST",
      body: JSON.stringify({
        idea,
        email: "not-an-email",
        channel: "direct",
        signal: "interview",
      }),
    }));
    expect(applicationResponse.status).toBe(400);
  });
});
