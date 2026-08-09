import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ resolve: vi.fn() }));

vi.mock("@/lib/matpin/store", () => ({
  resolveMatpinShortLink: mocks.resolve,
}));

import { GET } from "@/app/s/[code]/route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Matpin short saved-list link", () => {
  it("rejects malformed codes without reading storage", async () => {
    const response = await GET(
      new Request("https://matpin.example/s/short"),
      { params: Promise.resolve({ code: "short" }) },
    );

    expect(response.status).toBe(404);
    expect(mocks.resolve).not.toHaveBeenCalled();
  });

  it("redirects a valid code without caching or referrer leakage", async () => {
    mocks.resolve.mockResolvedValue("private-access-token");
    const response = await GET(
      new Request("https://matpin.example/s/AbCdEfGhIjKlMnOp"),
      { params: Promise.resolve({ code: "AbCdEfGhIjKlMnOp" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location"))
      .toBe("https://matpin.example/matpin/saved#token=private-access-token");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
