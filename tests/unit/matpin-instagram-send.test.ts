import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isMatpinInstagramSendKnownNotSent,
  preflightMatpinInstagramMessage,
  sendMatpinInstagramMessage,
} from "@/lib/matpin/instagram-send";

function configureMeta() {
  vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "account-1");
  vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "secret-token");
  vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Matpin Instagram send outcome", () => {
  it("fails deterministic configuration and text checks without calling fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(() => preflightMatpinInstagramMessage("recipient-1", "확인했습니다."))
      .toThrow("meta_send_not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the Meta message id for a confirmed delivery", async () => {
    configureMeta();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      recipient_id: "recipient-1",
      message_id: "meta-message-1",
    }), { status: 200 })));

    await expect(sendMatpinInstagramMessage("recipient-1", "확인했습니다."))
      .resolves.toBe("meta-message-1");
  });

  it("combines caller cancellation with the local eight-second timeout", async () => {
    configureMeta();
    const controller = new AbortController();
    const timeoutController = new AbortController();
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeoutController.signal);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message_id: "meta-message-1",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendMatpinInstagramMessage("recipient-1", "확인했습니다.", {
      signal: controller.signal,
    });

    const combinedSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    expect(timeoutSpy).toHaveBeenCalledWith(8_000);
    expect(combinedSignal).not.toBe(controller.signal);
    expect(combinedSignal).not.toBe(timeoutController.signal);
    expect(combinedSignal.aborted).toBe(false);

    controller.abort();
    expect(combinedSignal.aborted).toBe(true);
  });

  it("keeps the local timeout active when a caller signal is present", async () => {
    configureMeta();
    const controller = new AbortController();
    const timeoutController = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutController.signal);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message_id: "meta-message-1",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendMatpinInstagramMessage("recipient-1", "확인했습니다.", {
      signal: controller.signal,
    });

    const combinedSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    timeoutController.abort();
    expect(combinedSignal.aborted).toBe(true);
  });

  it("treats a client rejection as a confirmed failure", async () => {
    configureMeta();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })));

    const error = await sendMatpinInstagramMessage("recipient-1", "확인했습니다.")
      .catch((caught) => caught);

    expect(error).toHaveProperty("message", "meta_send_failed:400");
    expect(error).toMatchObject({ httpStatus: 400, retryable: false });
    expect(isMatpinInstagramSendKnownNotSent(error)).toBe(true);
  });

  it("keeps only a 429 known-not-sent rejection retryable", async () => {
    configureMeta();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));

    const error = await sendMatpinInstagramMessage("recipient-1", "확인했습니다.")
      .catch((caught) => caught);

    expect(error).toMatchObject({
      deliveryOutcome: "known_not_sent",
      httpStatus: 429,
      retryable: true,
    });
  });

  it.each([
    ["network timeout", () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
    ["server failure", () => Promise.resolve(new Response("server error", { status: 503 }))],
    ["malformed success", () => Promise.resolve(new Response("{}", { status: 200 }))],
  ])("keeps %s as an uncertain delivery outcome", async (_label, response) => {
    configureMeta();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(response));

    await expect(sendMatpinInstagramMessage("recipient-1", "확인했습니다."))
      .rejects.toThrow("meta_send_outcome_uncertain");
  });

  it("preserves a 5xx status without marking an uncertain outcome retryable", async () => {
    configureMeta();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("server error", { status: 503 })));

    const error = await sendMatpinInstagramMessage("recipient-1", "확인했습니다.")
      .catch((caught) => caught);

    expect(error).toMatchObject({
      deliveryOutcome: "uncertain",
      httpStatus: 503,
      retryable: false,
    });
  });
});
