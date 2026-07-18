import { afterEach, describe, expect, it, vi } from "vitest";
import { shareToKakao } from "../../src/lib/kakao-share";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("shareToKakao", () => {
  it("opens only the KakaoTalk default-share picker with an absolute receiver URL", async () => {
    const sendDefault = vi.fn();
    const uploadImage = vi.fn().mockResolvedValue([{
      url: "https://k.kakaocdn.net/dn/oneul-haebolkka-share.png",
      length: 12_345,
      content_type: "image/png",
      width: 1080,
      height: 1920,
    }]);
    const nativeShare = vi.fn();
    const clipboardWrite = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: (value: string) => ({ width: Array.from(value).length * 28 }),
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        createRadialGradient: () => ({ addColorStop: vi.fn() }),
        set fillStyle(_: string | CanvasGradient) {},
        set strokeStyle(_: string) {},
        set lineWidth(_: number) {},
        set font(_: string) {},
        set textAlign(_: CanvasTextAlign) {},
        set textBaseline(_: CanvasTextBaseline) {},
      }),
      toBlob: (callback: BlobCallback) => callback(new Blob(["png"], { type: "image/png" })),
    };
    class TestFile extends Blob {
      name: string;
      lastModified: number;

      constructor(parts: BlobPart[], name: string, options: FilePropertyBag = {}) {
        super(parts, options);
        this.name = name;
        this.lastModified = options.lastModified ?? 0;
      }
    }
    class TestDataTransfer {
      files = [] as unknown as FileList;
      items = {
        add: (file: File) => {
          (this.files as unknown as File[]).push(file);
        },
      };
    }
    vi.stubGlobal("File", TestFile);
    vi.stubGlobal("DataTransfer", TestDataTransfer);
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(canvas),
    });
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
      Kakao: {
        init: vi.fn(),
        isInitialized: () => true,
        Share: { uploadImage, sendDefault },
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
    expect(uploadImage).toHaveBeenCalledWith({
      file: expect.objectContaining({
        0: expect.objectContaining({
          name: "oneul-haebolkka-share.png",
          type: "image/png",
        }),
      }),
    });
    expect(sendDefault).toHaveBeenCalledWith({
      objectType: "feed",
      content: {
        title: "결정만 남기는 음성 메모",
        description: "짧은 응원이나 의견을 남겨주세요.",
        imageUrl: "https://k.kakaocdn.net/dn/oneul-haebolkka-share.png",
        imageWidth: 1080,
        imageHeight: 1920,
        link: {
          mobileWebUrl: "https://oneul.example/praise/request-1",
          webUrl: "https://oneul.example/praise/request-1",
        },
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

  it("replaces a local receiver origin with the deployed public site", async () => {
    const sendDefault = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:3000" },
      Kakao: {
        init: vi.fn(),
        isInitialized: () => true,
        Share: { sendDefault },
      },
    });

    await shareToKakao("/praise/local-request?from=share");

    expect(sendDefault).toHaveBeenCalledWith(expect.objectContaining({
      link: {
        mobileWebUrl: "https://bfd-seven.vercel.app/praise/local-request?from=share",
        webUrl: "https://bfd-seven.vercel.app/praise/local-request?from=share",
      },
    }));
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
