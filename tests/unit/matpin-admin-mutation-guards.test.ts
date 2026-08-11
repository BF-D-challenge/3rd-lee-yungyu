import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  after: vi.fn(),
  processQueue: vi.fn(),
  requeue: vi.fn(),
  reprocess: vi.fn(),
  resend: vi.fn(),
  sendReply: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/server")>();
  return { ...original, after: mocks.after };
});

vi.mock("@/lib/matpin/admin-auth", () => ({
  getMatpinAdminAccess: mocks.access,
}));

vi.mock("@/lib/matpin/admin-service", () => ({
  reprocessMatpinAdminMessage: mocks.reprocess,
  resendMatpinAdminLibrary: mocks.resend,
  sendMatpinAdminReply: mocks.sendReply,
}));

vi.mock("@/lib/matpin/worker", () => ({
  processMatpinQueue: mocks.processQueue,
}));

vi.mock("@/lib/matpin/store", () => ({
  requeueFailedMatpinMessage: mocks.requeue,
}));

import { POST as sendReply } from "@/app/api/matpin/admin/conversations/[id]/messages/route";
import { POST as reprocess } from "@/app/api/matpin/admin/messages/[id]/reprocess/route";
import { POST as resend } from "@/app/api/matpin/admin/messages/[id]/resend/route";
import { POST as bearerReprocess } from "@/app/api/matpin/messages/[id]/reprocess/route";

const idempotencyKey = "22222222-2222-4222-8222-222222222222";
const authorizedAccess = {
  state: "authorized",
  user: { id: "11111111-1111-4111-8111-111111111111" },
} as const;

function postRequest(path: string, body: string) {
  return new Request(`https://matpin.kr${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

const mutations = [
  {
    label: "manual reply",
    invoke: (body: string) => sendReply(
      postRequest("/api/matpin/admin/conversations/conversation-1/messages", body),
      { params: Promise.resolve({ id: "conversation-1" }) },
    ),
  },
  {
    label: "library resend",
    invoke: (body: string) => resend(
      postRequest(
        "/api/matpin/admin/messages/33333333-3333-4333-8333-333333333333/resend",
        body,
      ),
      { params: Promise.resolve({ id: "33333333-3333-4333-8333-333333333333" }) },
    ),
  },
  {
    label: "analysis reprocess",
    invoke: (body: string) => reprocess(
      postRequest(
        "/api/matpin/admin/messages/33333333-3333-4333-8333-333333333333/reprocess",
        body,
      ),
      { params: Promise.resolve({ id: "33333333-3333-4333-8333-333333333333" }) },
    ),
  },
] as const;

beforeEach(() => {
  vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "live");
  vi.stubEnv("VERCEL_ENV", "production");
  mocks.access.mockReset().mockResolvedValue(authorizedAccess);
  mocks.after.mockReset();
  mocks.processQueue.mockReset().mockResolvedValue([]);
  mocks.requeue.mockReset().mockResolvedValue(true);
  mocks.reprocess.mockReset().mockResolvedValue({ accepted: true });
  mocks.resend.mockReset().mockResolvedValue({ duplicate: false, metaMessageId: "meta-resend-1" });
  mocks.sendReply.mockReset().mockResolvedValue({ duplicate: false, metaMessageId: "meta-reply-1" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Matpin admin mutation pipeline guard", () => {
  it.each([
    ["live", "preview"],
    ["live", ""],
    ["", "production"],
    ["unexpected", "production"],
    ["mock", "preview"],
    ["maintenance", "production"],
  ])(
    "blocks every authorized mutation before parsing or side effects for %s in %j",
    async (mode, vercelEnvironment) => {
      vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", mode);
      vi.stubEnv("VERCEL_ENV", vercelEnvironment);

      for (const mutation of mutations) {
        const response = await mutation.invoke("not-json");
        expect(response.status, mutation.label).toBe(409);
        expect(await response.json(), mutation.label).toEqual({ error: "pipeline_not_live" });
        expect(response.headers.get("cache-control"), mutation.label).toContain("private");
        expect(response.headers.get("cache-control"), mutation.label).toContain("no-store");
      }

      expect(mocks.sendReply).not.toHaveBeenCalled();
      expect(mocks.resend).not.toHaveBeenCalled();
      expect(mocks.reprocess).not.toHaveBeenCalled();
      expect(mocks.after).not.toHaveBeenCalled();
      expect(mocks.processQueue).not.toHaveBeenCalled();
    },
  );

  it("keeps authentication ahead of the pipeline guard", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    mocks.access.mockResolvedValue({ state: "unauthenticated" });

    for (const mutation of mutations) {
      const response = await mutation.invoke("not-json");
      expect(response.status, mutation.label).toBe(401);
      expect(await response.json(), mutation.label).toEqual({ error: "unauthenticated" });
    }

    expect(mocks.sendReply).not.toHaveBeenCalled();
    expect(mocks.resend).not.toHaveBeenCalled();
    expect(mocks.reprocess).not.toHaveBeenCalled();
  });

  it("preserves the three Production-live mutation responses", async () => {
    const reply = await mutations[0].invoke(JSON.stringify({
      text: "확인했습니다.",
      idempotencyKey,
    }));
    const library = await mutations[1].invoke(JSON.stringify({
      conversationId: "conversation-1",
      idempotencyKey,
    }));
    const retry = await mutations[2].invoke(JSON.stringify({
      conversationId: "conversation-1",
      idempotencyKey,
    }));

    expect(reply.status).toBe(200);
    expect(await reply.json()).toMatchObject({ ok: true });
    expect(library.status).toBe(200);
    expect(await library.json()).toMatchObject({ ok: true });
    expect(retry.status).toBe(202);
    expect(await retry.json()).toMatchObject({ ok: true, result: { accepted: true } });
    expect(mocks.sendReply).toHaveBeenCalledTimes(1);
    expect(mocks.resend).toHaveBeenCalledTimes(1);
    expect(mocks.reprocess).toHaveBeenCalledTimes(1);
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });
});

describe("Matpin bearer reprocess pipeline guard", () => {
  it.each([
    ["", "production"],
    ["unexpected", "production"],
    ["live", "preview"],
    ["live", ""],
    ["mock", "preview"],
    ["maintenance", "production"],
  ])(
    "blocks requeue and worker side effects for mode %j in %j",
    async (mode, vercelEnvironment) => {
      vi.stubEnv("CRON_SECRET", "cron-test-secret");
      vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", mode);
      vi.stubEnv("VERCEL_ENV", vercelEnvironment);

      const response = await bearerReprocess(
        new Request(
          "https://matpin.kr/api/matpin/messages/33333333-3333-4333-8333-333333333333/reprocess",
          {
            method: "POST",
            headers: { authorization: "Bearer cron-test-secret" },
          },
        ),
        { params: Promise.resolve({ id: "33333333-3333-4333-8333-333333333333" }) },
      );

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: "pipeline_not_live" });
      expect(mocks.requeue).not.toHaveBeenCalled();
      expect(mocks.after).not.toHaveBeenCalled();
      expect(mocks.processQueue).not.toHaveBeenCalled();
    },
  );
});
