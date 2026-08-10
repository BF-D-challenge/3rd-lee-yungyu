import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MatpinDeadline,
  MatpinDeadlineExceededError,
} from "@/lib/matpin/deadline";
import { loadInstagramReelPreview } from "@/lib/matpin/reel-source";

const dns = vi.hoisted(() => ({ lookup: vi.fn() }));

vi.mock("node:dns/promises", () => ({ lookup: dns.lookup }));

afterEach(() => {
  dns.lookup.mockReset();
});

describe("Instagram Reel source DNS validation", () => {
  it("bounds DNS lookup with the shared deadline", async () => {
    dns.lookup.mockImplementation(() => new Promise(() => {}));
    const parent = new AbortController();
    const deadline = new MatpinDeadline({
      durationMs: 1_000,
      reserveMs: 100,
      parentSignal: parent.signal,
    });
    const fetchImpl = vi.fn<typeof fetch>();

    const result = loadInstagramReelPreview(
      "https://www.instagram.com/reel/DL7j0DVS4jD/",
      fetchImpl,
      { deadline },
    );
    expect(dns.lookup).toHaveBeenCalledWith("www.instagram.com", {
      all: true,
      verbatim: true,
    });

    parent.abort();

    await expect(result).rejects.toBeInstanceOf(MatpinDeadlineExceededError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps private DNS results blocked before fetch", async () => {
    dns.lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(loadInstagramReelPreview(
      "https://www.instagram.com/reel/DL7j0DVS4jD/",
      fetchImpl,
    )).rejects.toMatchObject({
      code: "reel_source_private",
      retryable: false,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps the no-deadline fetch path unchanged for public DNS", async () => {
    dns.lookup.mockResolvedValue([{ address: "157.240.22.174", family: 4 }]);
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }));

    await expect(loadInstagramReelPreview(
      "https://www.instagram.com/reel/DL7j0DVS4jD/",
      fetchImpl,
    )).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
