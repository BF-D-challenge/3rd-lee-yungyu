import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@supabase/supabase-js")>();
  return { ...original, createClient: mocks.createClient };
});

import { claimNextMatpinMessage } from "@/lib/matpin/store";
import {
  createMatpinAccessToken,
  createMatpinShortLinkCode,
  decryptMatpinValue,
  encryptMatpinValue,
  hashMatpinAccessToken,
  hashMatpinShortLinkCode,
} from "@/lib/matpin/security";
import { processMatpinQueue } from "@/lib/matpin/worker";

type QueryResult = { data: unknown; error: { message: string } | null };

function request(result: QueryResult) {
  const query = {} as PromiseLike<QueryResult> & {
    abortSignal: ReturnType<typeof vi.fn>;
  };
  query.abortSignal = vi.fn(() => query);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

const messageId = "11111111-1111-4111-8111-111111111111";
const analysisClaimToken = "22222222-2222-4222-8222-222222222222";
const senderHash = "a".repeat(64);

function terminalClaim(options: {
  poisoned?: boolean;
  attemptCount?: number;
  senderCiphertext?: string;
} = {}) {
  const senderScopedId = "sender-1";
  return {
    queueMessageId: 31,
    poisoned: options.poisoned ?? false,
    terminalFailureRequired: true,
    message: {
      id: messageId,
      sender_hash: senderHash,
      reel_id: "DbTBhcZNY1b",
      reel_url: "https://www.instagram.com/reel/DbTBhcZNY1b/",
      attachment_type: "ig_reel",
      media_url_ciphertext: encryptMatpinValue("https://video.cdninstagram.com/reel.mp4"),
      reply_required: true,
      attempt_count: options.attemptCount ?? 2,
      outbound_generation: 2,
      analysis_claim_token: analysisClaimToken,
    },
    user: {
      sender_hash: senderHash,
      sender_ciphertext: options.senderCiphertext ?? encryptMatpinValue(senderScopedId),
      access_token_hash: hashMatpinAccessToken(createMatpinAccessToken(senderScopedId)),
      short_link_hash: hashMatpinShortLinkCode(createMatpinShortLinkCode(senderScopedId)),
    },
  };
}

type TerminalClaim = ReturnType<typeof terminalClaim>;

const optionalPayloadFailures: Array<[
  string,
  (claim: TerminalClaim) => void,
]> = [
  ["access token hash mismatch", (claim) => {
    claim.user.access_token_hash = "b".repeat(64);
  }],
  ["short-link hash mismatch", (claim) => {
    claim.user.short_link_hash = "c".repeat(64);
  }],
  ["malformed media ciphertext", (claim) => {
    claim.message.media_url_ciphertext = "not-a-ciphertext";
  }],
];

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("MATPIN_DATA_SECRET", "data-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("MATPIN_LINK_SECRET", "link-secret-that-is-at-least-32-characters-long");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin poisoned analysis claims", () => {
  it.each(optionalPayloadFailures)(
    "atomically completes attempt two when the original failure is %s",
    async (_label, corrupt) => {
      const claim = terminalClaim();
      corrupt(claim);
      const rpc = vi.fn()
        .mockReturnValueOnce(request({ data: claim, error: null }))
        .mockReturnValueOnce(request({
          data: {
            completed: true,
            outboundId: "33333333-3333-4333-8333-333333333333",
            deliveryState: "pending",
          },
          error: null,
        }));
      mocks.createClient.mockReturnValue({ rpc });

      await expect(processMatpinQueue(1)).resolves.toEqual([{
        state: "failed",
        messageId,
        code: "analysis_attempts_exhausted",
      }]);
      expect(rpc).toHaveBeenNthCalledWith(2, "matpin_complete_analysis_v2", expect.objectContaining({
        p_message_id: messageId,
        p_queue_message_id: 31,
        p_analysis_claim_token: analysisClaimToken,
        p_status: "failed",
        p_candidates: [],
        p_final_dedup_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_final_sender_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_final_recipient_ciphertext: expect.any(String),
        p_final_body_ciphertext: expect.any(String),
      }));
      const completion = rpc.mock.calls[1][1] as {
        p_final_recipient_ciphertext: string;
        p_final_body_ciphertext: string;
      };
      expect(decryptMatpinValue(completion.p_final_recipient_ciphertext)).toBe("sender-1");
      expect(decryptMatpinValue(completion.p_final_body_ciphertext)).toContain(
        "같은 게시물을 다시 보내주세요",
      );
    },
  );

  it("keeps only sender data needed for a poisoned generic completion", async () => {
    const claim = terminalClaim({ poisoned: true, attemptCount: 10 });
    claim.message.reel_url = "not-a-url";
    claim.message.media_url_ciphertext = "not-a-ciphertext";
    claim.user.access_token_hash = "broken-access-token-hash";
    claim.user.short_link_hash = "broken-short-link-hash";
    const rpc = vi.fn()
      .mockReturnValueOnce(request({ data: claim, error: null }))
      .mockReturnValueOnce(request({
        data: {
          completed: true,
          outboundId: "33333333-3333-4333-8333-333333333333",
          deliveryState: "pending",
        },
        error: null,
      }));
    mocks.createClient.mockReturnValue({ rpc });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "failed",
      messageId,
      code: "analysis_attempts_exhausted",
    }]);
    expect(rpc).toHaveBeenNthCalledWith(2, "matpin_complete_analysis_v2", expect.objectContaining({
      p_message_id: messageId,
      p_queue_message_id: 31,
      p_analysis_claim_token: analysisClaimToken,
      p_status: "failed",
      p_final_body_ciphertext: expect.any(String),
    }));
  });

  it("quarantines an unreadable poisoned sender with the active claim token", async () => {
    const rpc = vi.fn()
      .mockReturnValueOnce(request({
        data: terminalClaim({
          poisoned: true,
          attemptCount: 10,
          senderCiphertext: "not-a-ciphertext",
        }),
        error: null,
      }))
      .mockReturnValueOnce(request({ data: true, error: null }));
    mocks.createClient.mockReturnValue({ rpc });
    const signal = AbortSignal.timeout(1_000);

    await expect(claimNextMatpinMessage({ signal })).resolves.toBeNull();
    expect(rpc).toHaveBeenNthCalledWith(2, "matpin_terminalize_unreadable_claim", {
      p_message_id: messageId,
      p_queue_message_id: 31,
      p_analysis_claim_token: analysisClaimToken,
    });
  });
});
