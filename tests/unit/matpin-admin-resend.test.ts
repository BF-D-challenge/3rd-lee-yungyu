import { afterEach, describe, expect, it, vi } from "vitest";

const senderHash = "a".repeat(64);
const shortLinkHash = "c".repeat(64);

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  send: vi.fn(),
  decrypt: vi.fn(() => "scoped-user-1"),
  hashSender: vi.fn((value: string) => value === "scoped-user-1" ? "a".repeat(64) : "b".repeat(64)),
}));

vi.mock("@/lib/matpin/store", () => ({
  getMatpinServerClient: mocks.getClient,
}));

vi.mock("@/lib/matpin/instagram-send", () => ({
  sendMatpinInstagramMessage: mocks.send,
}));

vi.mock("@/lib/matpin/security", () => ({
  createMatpinAccessToken: () => "access-token",
  createMatpinShortLinkCode: () => "short-link-code",
  decryptMatpinValue: mocks.decrypt,
  hashMatpinAccessToken: () => "d".repeat(64),
  hashMatpinSender: mocks.hashSender,
  hashMatpinShortLinkCode: () => "c".repeat(64),
}));

import { resendMatpinLibrary } from "@/lib/matpin/resend";

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
};

function query(result: QueryResult) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "update", "eq", "is"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) => (
    Promise.resolve(result).then(resolve, reject)
  );
  return chain as {
    select: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: PromiseLike<QueryResult>["then"];
  };
}

function messageResult(status: "saved" | "failed" = "saved") {
  return query({ data: { sender_hash: senderHash, status }, error: null });
}

function userResult() {
  return query({
    data: {
      sender_ciphertext: "encrypted-value",
      access_token_hash: "d".repeat(64),
      short_link_hash: shortLinkHash,
      link_expires_at: "2099-01-01T00:00:00.000Z",
    },
    error: null,
  });
}

function clientWithCounts(messageCount: number, libraryCount = 3) {
  const message = messageResult();
  const user = userResult();
  const libraryPlaces = query({ data: null, error: null, count: libraryCount });
  const messagePlaces = query({ data: null, error: null, count: messageCount });
  mocks.getClient.mockReturnValue({
    from: vi.fn()
      .mockReturnValueOnce(message)
      .mockReturnValueOnce(user)
      .mockReturnValueOnce(libraryPlaces)
      .mockReturnValueOnce(messagePlaces),
  });
  return { messagePlaces };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin admin library resend target verification", () => {
  const messageId = "22222222-2222-4222-8222-222222222222";

  it("sends only after a saved message has an active place tied to it", async () => {
    vi.stubEnv("MATPIN_PUBLIC_APP_URL", "https://matpin.example");
    const { messagePlaces } = clientWithCounts(1);
    mocks.send.mockResolvedValue("meta-message-1");

    await expect(resendMatpinLibrary(messageId, "scoped-user-1")).resolves.toEqual({
      savedPlaceCount: 3,
      metaMessageId: "meta-message-1",
    });
    expect(messagePlaces.eq).toHaveBeenCalledWith("message_id", messageId);
    expect(messagePlaces.is).toHaveBeenCalledWith("deleted_at", null);
    expect(mocks.send).toHaveBeenCalledWith(
      "scoped-user-1",
      expect.stringContaining("https://matpin.example/s/short-link-code"),
    );
  });

  it("rejects a failed message before reading or sending user data", async () => {
    const message = messageResult("failed");
    const from = vi.fn().mockReturnValueOnce(message);
    mocks.getClient.mockReturnValue({ from });

    await expect(resendMatpinLibrary(messageId, "scoped-user-1"))
      .rejects.toThrow("matpin_resend_message_unavailable");
    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects when no active place belongs to the selected message", async () => {
    clientWithCounts(0, 3);

    await expect(resendMatpinLibrary(messageId, "scoped-user-1"))
      .rejects.toThrow("matpin_resend_places_unavailable");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects when the decrypted target differs from the live recipient", async () => {
    const message = messageResult();
    const user = userResult();
    const from = vi.fn()
      .mockReturnValueOnce(message)
      .mockReturnValueOnce(user);
    mocks.getClient.mockReturnValue({ from });

    await expect(resendMatpinLibrary(messageId, "different-user"))
      .rejects.toThrow("matpin_resend_recipient_mismatch");
    expect(from).toHaveBeenCalledTimes(2);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
