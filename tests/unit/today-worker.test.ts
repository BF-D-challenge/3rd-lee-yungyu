import { afterEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/today-server", () => {
  class TodayDeliveryConfigurationError extends Error {}
  return {
    TodayDeliveryConfigurationError,
    createTodayAccessToken: () => "worker-access-token-longer-than-24",
    getTodayServerClient: () => ({ rpc }),
  };
});

import { GET as processTodayJobs } from "@/app/api/today/jobs/process/route";
import { buildCatalogTodayIdea } from "@/lib/today-idea";

afterEach(() => {
  rpc.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Today 작업 큐 워커", () => {
  it("인증되지 않은 호출을 거절한다", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    const response = await processTodayJobs(new Request("https://example.com/api/today/jobs/process"));
    expect(response.status).toBe(401);
  });

  it("큐 작업을 생성하고 멱등 이메일을 보낸 뒤 ready로 완료한다", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("RESEND_API_KEY", "resend-secret");
    vi.stubEnv("TODAY_FROM_EMAIL", "Today <result@example.com>");
    vi.stubEnv("TODAY_PUBLIC_APP_URL", "https://today.example.com");

    const idea = buildCatalogTodayIdea({
      path: "guided",
      idea: "",
      answers: {
        customer: "consumer",
        moment: "scattered_info",
        strength: "organize",
      },
    });
    rpc.mockImplementation(async (name: string) => {
      if (name === "today_claim_next_job") {
        if (rpc.mock.calls.filter(([called]) => called === name).length > 1) {
          return { data: null, error: null };
        }
        return {
          data: {
            messageId: 17,
            job: {
              id: "00ce0139-6d09-4bd9-9c72-3ecce16a081d",
              email: "hello@example.com",
              idea,
              channel: "instagram",
              signal: "waitlist",
            },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });
    const resend = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", resend);

    const response = await processTodayJobs(new Request("https://example.com/api/today/jobs/process", {
      headers: { authorization: "Bearer cron-secret" },
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.processed).toEqual([
      { state: "completed", jobId: "00ce0139-6d09-4bd9-9c72-3ecce16a081d" },
      { state: "empty" },
    ]);
    expect(resend).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      headers: expect.objectContaining({
        "idempotency-key": "today-result/00ce0139-6d09-4bd9-9c72-3ecce16a081d",
      }),
    }));
    expect(rpc).toHaveBeenCalledWith("today_complete_job", expect.objectContaining({
      p_job_id: "00ce0139-6d09-4bd9-9c72-3ecce16a081d",
      p_message_id: 17,
      p_resend_email_id: "email_123",
      p_artifacts: expect.objectContaining({
        ad: expect.any(Object),
        landing: expect.any(Object),
        testPlan: expect.any(Object),
      }),
    }));
  });
});
