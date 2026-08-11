import { afterEach, describe, expect, it, vi } from "vitest";
import {
  matpinAdminPublicFailure,
  matpinAdminReprocessSchema,
  matpinAdminReplyWindow,
  matpinAdminResendSchema,
  matpinAdminSendSchema,
  matpinAdminSince,
} from "@/lib/matpin/admin-contract";
import { isAllowedMatpinAdmin, matpinAdminEmails } from "@/lib/matpin/admin-auth";
import {
  listMatpinInstagramConversations,
  normalizeMatpinAdminConversationMessages,
  readMatpinInstagramConversation,
  readMatpinInstagramReplyGuard,
} from "@/lib/matpin/admin-instagram";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Matpin admin authorization", () => {
  it("denies every account when the allowlist is empty", () => {
    vi.stubEnv("MATPIN_ADMIN_EMAILS", "");
    expect(matpinAdminEmails().size).toBe(0);
    expect(isAllowedMatpinAdmin({
      email: "owner@example.com",
      email_confirmed_at: "2026-08-09T00:00:00.000Z",
      app_metadata: { provider: "google", providers: ["google"] },
    })).toBe(false);
  });

  it("requires a confirmed Google email in the normalized allowlist", () => {
    vi.stubEnv("MATPIN_ADMIN_EMAILS", " Owner@Example.com, ops@example.com ");
    expect([...matpinAdminEmails()]).toEqual(["owner@example.com", "ops@example.com"]);
    expect(isAllowedMatpinAdmin({
      email: "OWNER@example.com",
      email_confirmed_at: "2026-08-09T00:00:00.000Z",
      app_metadata: { provider: "google", providers: ["google"] },
    })).toBe(true);
    expect(isAllowedMatpinAdmin({
      email: "owner@example.com",
      email_confirmed_at: "2026-08-09T00:00:00.000Z",
      app_metadata: { provider: "github", providers: ["github"] },
    })).toBe(false);
  });
});

describe("Matpin admin reply guard", () => {
  const now = Date.parse("2026-08-09T12:00:00.000Z");

  it("closes the reply window at the exact 24-hour boundary", () => {
    expect(matpinAdminReplyWindow("2026-08-08T12:00:00.000Z", now)).toEqual({
      canReply: false,
      endsAt: "2026-08-09T12:00:00.000Z",
    });
    expect(matpinAdminReplyWindow("2026-08-08T12:00:00.001Z", now).canReply).toBe(true);
    expect(matpinAdminReplyWindow("2026-08-08T11:59:59.999Z", now).canReply).toBe(false);
  });

  it("limits manual messages to trimmed UTF-8 text of at most 1,000 bytes", () => {
    const key = "11111111-1111-4111-8111-111111111111";
    expect(matpinAdminSendSchema.parse({ text: "  확인했습니다.  ", idempotencyKey: key }).text)
      .toBe("확인했습니다.");
    expect(matpinAdminSendSchema.safeParse({ text: "", idempotencyKey: key }).success).toBe(false);
    expect(matpinAdminSendSchema.safeParse({ text: "가".repeat(334), idempotencyKey: key }).success).toBe(false);
    expect(matpinAdminSendSchema.safeParse({ text: "가".repeat(1001), idempotencyKey: key }).success).toBe(false);
  });

  it("requires a validated conversation id for a library resend", () => {
    const idempotencyKey = "11111111-1111-4111-8111-111111111111";
    expect(matpinAdminResendSchema.parse({ conversationId: "conversation-1", idempotencyKey }))
      .toEqual({ conversationId: "conversation-1", idempotencyKey });
    expect(matpinAdminResendSchema.safeParse({ idempotencyKey }).success).toBe(false);
    expect(matpinAdminResendSchema.safeParse({ conversationId: "../unsafe", idempotencyKey }).success).toBe(false);
    expect(matpinAdminReprocessSchema.safeParse({ idempotencyKey }).success).toBe(false);
  });

  it("maps private worker errors to stable public codes and reasons", () => {
    expect(matpinAdminPublicFailure("gemini_upstream:private provider detail")).toEqual({
      code: "analysis_unavailable",
      reason: "게시물 분석을 완료하지 못했습니다.",
    });
    expect(JSON.stringify(matpinAdminPublicFailure("database_failed:password=secret")))
      .not.toContain("secret");
  });

  it("produces deterministic range boundaries", () => {
    expect(matpinAdminSince("24h", now)).toBe("2026-08-08T12:00:00.000Z");
    expect(matpinAdminSince("all", now)).toBeNull();
  });
});

describe("Matpin live conversation normalization", () => {
  it("retains only one-to-one messages where the configured account is a participant", () => {
    const normalized = normalizeMatpinAdminConversationMessages({ data: [
      {
        id: "inbound-valid",
        created_time: "2026-08-09T10:00:00+00:00",
        from: { id: "sender-1" },
        to: { data: [{ id: "account-1" }] },
      },
      {
        id: "outbound-valid",
        created_time: "2026-08-09T10:01:00+00:00",
        from: { id: "account-1" },
        to: { data: [{ id: "sender-1" }] },
      },
      {
        id: "account-absent",
        created_time: "2026-08-09T10:02:00+00:00",
        from: { id: "sender-1" },
        to: { data: [{ id: "someone-else" }] },
      },
      {
        id: "group-message",
        created_time: "2026-08-09T10:03:00+00:00",
        from: { id: "sender-1" },
        to: { data: [{ id: "account-1" }, { id: "sender-2" }] },
      },
    ] }, "account-1");

    expect(normalized.recipientId).toBe("sender-1");
    expect(normalized.messages.map((message) => [message.id, message.direction])).toEqual([
      ["inbound-valid", "inbound"],
      ["outbound-valid", "outbound"],
    ]);
  });

  it("rejects a conversation when valid messages identify multiple counterparts", () => {
    const normalized = normalizeMatpinAdminConversationMessages({ data: [
      {
        id: "message-1",
        created_time: "2026-08-09T10:00:00+00:00",
        from: { id: "sender-1" },
        to: { data: [{ id: "account-1" }] },
      },
      {
        id: "message-2",
        created_time: "2026-08-09T10:01:00+00:00",
        from: { id: "account-1" },
        to: { data: [{ id: "sender-2" }] },
      },
    ] }, "account-1");

    expect(normalized).toEqual({ recipientId: null, messages: [] });
  });

  it("does not hide a second counterpart behind the 20-message preview limit", () => {
    const data = Array.from({ length: 20 }, (_, index) => ({
      id: `message-${index}`,
      created_time: `2026-08-09T10:${String(index).padStart(2, "0")}:00+00:00`,
      from: { id: "sender-1" },
      to: { data: [{ id: "account-1" }] },
    }));
    data.push({
      id: "different-counterpart",
      created_time: "2026-08-09T10:30:00+00:00",
      from: { id: "sender-2" },
      to: { data: [{ id: "account-1" }] },
    });

    expect(normalizeMatpinAdminConversationMessages({ data }, "account-1"))
      .toEqual({ recipientId: null, messages: [] });
  });

  it("returns only public previews and caps recent messages at 20", () => {
    const messages = Array.from({ length: 25 }, (_, index) => ({
      id: `message-${index}`,
      created_time: `2026-08-09T${String(index % 20).padStart(2, "0")}:00:00+00:00`,
      from: { id: index % 2 ? "account-1" : "sender-1" },
      to: { data: [{ id: index % 2 ? "sender-1" : "account-1" }] },
      message: index === 0 ? "강남 맛집 게시물입니다." : undefined,
      attachments: index === 0
        ? { data: [{ type: "share", payload: { url: "https://private-media.example/file" } }] }
        : undefined,
      access_token: "must-not-leak",
      temporary_media_url: "https://private-media.example/temporary",
    }));
    const normalized = normalizeMatpinAdminConversationMessages({ data: messages }, "account-1");

    expect(normalized.recipientId).toBe("sender-1");
    expect(normalized.messages).toHaveLength(20);
    expect(normalized.messages[0]).toEqual(expect.objectContaining({
      id: "message-0",
      direction: "inbound",
      text: "강남 맛집 게시물입니다.",
      attachmentKind: "share",
    }));
    const serialized = JSON.stringify(normalized.messages);
    expect(serialized).not.toContain("must-not-leak");
    expect(serialized).not.toContain("private-media.example");
    expect(serialized).not.toContain("sender-1");
  });

  it("keeps the conversation usable when the live profile lookup fails", async () => {
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-access-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ messages: { data: [{
          id: "message-1",
          created_time: new Date().toISOString(),
          from: { id: "sender-1" },
          to: { data: [{ id: "account-1" }] },
          message: "안녕하세요",
        }] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await readMatpinInstagramConversation("conversation-1");

    expect(result.profile).toEqual({ name: null, username: null });
    expect(result.messages).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const detailUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(detailUrl.pathname).toBe("/v23.0/conversation-1");
    expect(detailUrl.searchParams.get("fields"))
      .toBe("messages{id,created_time,from,to,message,attachments,is_unsupported}");
  });

  it("reads only recipient and reply-window fields for the mutation guard", async () => {
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-access-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    const createdAt = new Date(Date.now() - 60_000).toISOString();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: { data: [{
      id: "message-1",
      created_time: createdAt,
      from: { id: "sender-1" },
      to: { data: [{ id: "account-1" }] },
    }] } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(readMatpinInstagramReplyGuard("conversation-1")).resolves.toEqual({
      recipientId: "sender-1",
      canReply: true,
      replyWindowEndsAt: new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1_000).toISOString(),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const guardUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(guardUrl.pathname).toBe("/v23.0/conversation-1");
    expect(guardUrl.searchParams.get("fields")).toBe("messages{id,created_time,from,to}");
    expect(guardUrl.searchParams.get("fields")).not.toContain("message,");
    expect(guardUrl.searchParams.get("fields")).not.toContain("attachments");
  });

  it("does not fetch individual profiles while loading the conversation list", async () => {
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-access-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/account-1/conversations")) {
        return new Response(JSON.stringify({ data: [{ id: "conversation-1" }] }), { status: 200 });
      }
      if (url.pathname.endsWith("/conversation-1")) {
        return new Response(JSON.stringify({ messages: { data: [{
          id: "message-1",
          created_time: new Date().toISOString(),
          from: { id: "sender-1" },
          to: { data: [{ id: "account-1" }] },
          message: "안녕하세요",
        }] } }), { status: 200 });
      }
      throw new Error(`unexpected_profile_fetch:${url.pathname}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(listMatpinInstagramConversations()).resolves.toEqual(expect.objectContaining({
      conversations: [expect.objectContaining({
        recipientId: "sender-1",
        profile: { name: null, username: null },
      })],
    }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).pathname))
      .toEqual(["/v23.0/account-1/conversations", "/v23.0/conversation-1"]);
  });

  it("surfaces a conversation-list rate limit instead of returning a false empty state", async () => {
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-access-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));

    await expect(listMatpinInstagramConversations()).rejects.toThrow("meta_admin_fetch_failed:429");
  });

  it("does not turn failed conversation details into a false empty inbox", async () => {
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-access-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "conversation-1" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listMatpinInstagramConversations()).rejects.toThrow("meta_admin_fetch_failed:conversation_details");
  });

  it("returns successful conversations with a partial marker when one detail fails", async () => {
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-access-token");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/account-1/conversations")) {
        return new Response(JSON.stringify({
          data: [{ id: "conversation-1" }, { id: "conversation-2" }],
        }), { status: 200 });
      }
      if (url.pathname.endsWith("/conversation-1")) {
        return new Response(JSON.stringify({ messages: { data: [{
          id: "message-1",
          created_time: "2026-08-09T10:00:00+00:00",
          from: { id: "sender-1" },
          to: { data: [{ id: "account-1" }] },
          message: "안녕하세요",
        }] } }), { status: 200 });
      }
      if (url.pathname.endsWith("/sender-1")) {
        return new Response(JSON.stringify({ username: "tester" }), { status: 200 });
      }
      return new Response("rate limited", { status: 429 });
    }));

    await expect(listMatpinInstagramConversations()).resolves.toEqual(expect.objectContaining({
      partial: true,
      conversations: [expect.objectContaining({ id: "conversation-1" })],
    }));
  });
});
