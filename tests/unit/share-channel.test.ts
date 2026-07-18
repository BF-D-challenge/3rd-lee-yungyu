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
