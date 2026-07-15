import { describe, expect, it, vi } from "vitest";
import { decodeBinaryBase64Url, encodeBinaryBase64Url } from "@/lib/base64-url";
import { copyText } from "@/lib/copy-text";

describe("Base64 URL binary codec", () => {
  it("keeps the existing URL-safe alphabet and restores omitted padding", () => {
    const binary = encodeURIComponent('{"title":"오늘 해볼까"}');
    const encoded = encodeBinaryBase64Url(binary);

    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBinaryBase64Url(encoded)).toBe(binary);
  });
});

describe("copyText", () => {
  it("uses the Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyText("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to a temporary textarea and always removes it", async () => {
    const area = {
      value: "",
      style: { position: "", opacity: "" },
      setAttribute: vi.fn(),
      select: vi.fn(),
      remove: vi.fn(),
    };
    const appendChild = vi.fn();
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } });
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(area),
      body: { appendChild },
      execCommand,
    });

    await expect(copyText("fallback")).resolves.toBe(true);
    expect(area.value).toBe("fallback");
    expect(appendChild).toHaveBeenCalledWith(area);
    expect(area.select).toHaveBeenCalledOnce();
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(area.remove).toHaveBeenCalledOnce();
  });
});
