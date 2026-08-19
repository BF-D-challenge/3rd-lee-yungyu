import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));

vi.mock("@/lib/matpin/store", () => ({
  readMatpinPublicProfile: mocks.read,
}));

import { GET } from "@/app/api/matpin/public/[username]/route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Matpin public profile route", () => {
  it("returns the minimal profile without caching", async () => {
    mocks.read.mockResolvedValue({
      username: "public.foodie",
      places: [{
        reelId: "Post_123",
        reelUrl: "https://www.instagram.com/p/Post_123/",
        place: {
          name: "테스트 식당",
          area: "서울",
          category: "한식",
          address: "서울 중구 세종대로 1",
          latitude: 37.5665,
          longitude: 126.978,
          mapUrl: "https://maps.google.com/?q=test",
        },
      }],
    });

    const response = await GET(
      new Request("https://matpin.example/api/matpin/public/public.foodie"),
      { params: Promise.resolve({ username: "Public.Foodie" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await response.json()).toEqual(expect.objectContaining({ username: "public.foodie" }));
    expect(mocks.read).toHaveBeenCalledWith("Public.Foodie");
  });

  it("does not distinguish an absent or private profile", async () => {
    mocks.read.mockResolvedValue(null);
    const response = await GET(
      new Request("https://matpin.example/api/matpin/public/private_user"),
      { params: Promise.resolve({ username: "private_user" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
