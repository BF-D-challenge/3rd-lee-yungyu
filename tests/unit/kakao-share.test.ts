import { afterEach, describe, expect, it, vi } from "vitest";
import { shareToKakao } from "../../src/lib/kakao-share";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("shareToKakao", () => {
  it("opens only the KakaoTalk default-share picker with an absolute receiver URL", async () => {
    const sendDefault = vi.fn();
    const nativeShare = vi.fn();
    const clipboardWrite = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
      Kakao: {
        init: vi.fn(),
        isInitialized: () => true,
        Share: { sendDefault },
      },
    });
    vi.stubGlobal("navigator", {
      share: nativeShare,
      clipboard: { writeText: clipboardWrite },
    });

    const result = await shareToKakao("/praise/request-1", {
      title: "결정만 남기는 음성 메모",
      text: "짧은 응원이나 의견을 남겨주세요.",
      buttonTitle: "친구 반응 남기기",
      serverCallbackArgs: { request_id: "request-1" },
    });

    expect(result).toEqual({ ok: true, method: "kakao" });
    expect(sendDefault).toHaveBeenCalledWith({
      objectType: "text",
      text: "결정만 남기는 음성 메모\n\n짧은 응원이나 의견을 남겨주세요.",
      link: {
        mobileWebUrl: "https://oneul.example/praise/request-1",
        webUrl: "https://oneul.example/praise/request-1",
      },
      buttonTitle: "친구 반응 남기기",
      installTalk: true,
      serverCallbackArgs: { request_id: "request-1" },
    });
    expect(nativeShare).not.toHaveBeenCalled();
    expect(clipboardWrite).not.toHaveBeenCalled();
  });

  it("initializes the SDK with the public JavaScript key before sharing", async () => {
    let initialized = false;
    const init = vi.fn(() => {
      initialized = true;
    });
    const sendDefault = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY", "test-javascript-key");
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
      Kakao: {
        init,
        isInitialized: () => initialized,
        Share: { sendDefault },
      },
    });

    const result = await shareToKakao("https://oneul.example/card");

    expect(result.ok).toBe(true);
    expect(init).toHaveBeenCalledWith("test-javascript-key");
    expect(sendDefault).toHaveBeenCalledOnce();
  });

  it("fails closed instead of falling back when the Kakao SDK is unavailable", async () => {
    const nativeShare = vi.fn();
    const clipboardWrite = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
    });
    vi.stubGlobal("navigator", {
      share: nativeShare,
      clipboard: { writeText: clipboardWrite },
    });

    await expect(shareToKakao("/card")).resolves.toEqual({
      ok: false,
      method: "kakao",
      reason: "sdk_unavailable",
    });
    expect(nativeShare).not.toHaveBeenCalled();
    expect(clipboardWrite).not.toHaveBeenCalled();
  });
});
