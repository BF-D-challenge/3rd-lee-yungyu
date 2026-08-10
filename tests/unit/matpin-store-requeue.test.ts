import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  encrypt: vi.fn(() => "encrypted-media-url"),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  return { ...actual, createClient: mocks.createClient };
});

vi.mock("@/lib/matpin/security", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/matpin/security")>();
  return { ...actual, encryptMatpinValue: mocks.encrypt };
});

import { requeueFailedMatpinMessage } from "@/lib/matpin/store";

const messageId = "22222222-2222-4222-8222-222222222222";

function clientForRequeue() {
  const messageQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: { id: messageId, status: "failed", reel_url: "https://www.instagram.com/reel/example/" },
      error: null,
    })),
  };
  messageQuery.select.mockReturnValue(messageQuery);
  messageQuery.eq.mockReturnValue(messageQuery);
  const rpc = vi.fn(async () => ({ data: { accepted: true, queueMessageId: 101 }, error: null }));
  mocks.createClient.mockReturnValue({ from: vi.fn(() => messageQuery), rpc });
  return { rpc };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("requeueFailedMatpinMessage", () => {
  it("keeps the established automatic-reply default for the bearer reprocess API", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    const { rpc } = clientForRequeue();

    await expect(requeueFailedMatpinMessage(messageId)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("matpin_requeue_failed_message", {
      p_message_id: messageId,
      p_media_url_ciphertext: "encrypted-media-url",
    });
  });

  it("allows the admin workflow to reprocess without sending a new automatic reply", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    const { rpc } = clientForRequeue();

    await expect(requeueFailedMatpinMessage(messageId, { replyRequired: false })).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("matpin_requeue_failed_message_without_reply", {
      p_message_id: messageId,
      p_media_url_ciphertext: "encrypted-media-url",
    });
  });
});
