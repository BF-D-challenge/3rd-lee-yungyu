import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyShareLink,
  shareToInstagram,
} from "../../src/lib/share-channel";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("share channel transports", () => {
  it("shares a generated 9:16 PNG when the device accepts image files", async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    const fillText = vi.fn();
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
        fillText,
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
    vi.stubGlobal("File", TestFile);
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(canvas),
    });
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
    });
    vi.stubGlobal("navigator", {
      share: nativeShare,
      canShare,
      clipboard: { writeText: vi.fn() },
    });

    await expect(shareToInstagram("/praise/request-image", {
      title: "결정만 남기는 음성 메모",
      text: "작은 팀의 기획자가 회의 직후 쓰는 웹 아이디어",
    })).resolves.toEqual({ ok: true, method: "instagram" });

    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1920);
    expect(canShare).toHaveBeenCalledWith({
      files: [expect.objectContaining({
        name: "oneul-haebolkka-share.png",
        type: "image/png",
      })],
    });
    expect(nativeShare).toHaveBeenCalledWith({
      title: "결정만 남기는 음성 메모",
      text: "작은 팀의 기획자가 회의 직후 쓰는 웹 아이디어\n\nhttps://oneul.example/praise/request-image",
      files: [expect.objectContaining({
        name: "oneul-haebolkka-share.png",
        type: "image/png",
      })],
    });
    expect(fillText).toHaveBeenCalledWith("오늘 해볼까", 219, 125);
  });

  it("opens the device share menu for Instagram with the public receiver URL", async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:3000" },
    });
    vi.stubGlobal("navigator", {
      share: nativeShare,
      clipboard: { writeText: vi.fn() },
    });

    await expect(shareToInstagram("/praise/request-1", {
      title: "결정만 남기는 음성 메모",
      text: "짧은 응원이나 의견을 남겨주세요.",
    })).resolves.toEqual({ ok: true, method: "instagram" });
    expect(nativeShare).toHaveBeenCalledWith({
      title: "결정만 남기는 음성 메모",
      text: "짧은 응원이나 의견을 남겨주세요.",
      url: "https://bfd-seven.vercel.app/praise/request-1",
    });
  });

  it("keeps the Instagram share link by copying it when native sharing is unavailable", async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
    });
    vi.stubGlobal("navigator", {
      clipboard: { writeText: clipboardWrite },
    });

    await expect(shareToInstagram("/praise/request-2")).resolves.toEqual({
      ok: true,
      method: "instagram",
      fallback: "copy",
    });
    expect(clipboardWrite).toHaveBeenCalledWith("https://oneul.example/praise/request-2");
  });

  it("copies a receiver link without opening another share target", async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
    });
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      clipboard: { writeText: clipboardWrite },
    });

    await expect(copyShareLink("/praise/request-3")).resolves.toEqual({
      ok: true,
      method: "copy",
    });
    expect(clipboardWrite).toHaveBeenCalledWith("https://oneul.example/praise/request-3");
  });

  it("does not copy after the user cancels the native share menu", async () => {
    const clipboardWrite = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "https://oneul.example" },
    });
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
      clipboard: { writeText: clipboardWrite },
    });

    await expect(shareToInstagram("/praise/request-4")).resolves.toEqual({
      ok: false,
      method: "instagram",
      reason: "cancelled",
    });
    expect(clipboardWrite).not.toHaveBeenCalled();
  });
});
