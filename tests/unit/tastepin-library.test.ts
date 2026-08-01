import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/tastepin/library/route";
import { tastepinLibraryResponseSchema } from "@/lib/tastepin-library-contract";
import { distanceInMeters, formatDistance } from "@/lib/tastepin-distance";

describe("tastepin Instagram library", () => {
  it("returns an honestly labelled demo collection with map-ready places", async () => {
    const response = await GET(
      new Request("http://localhost/api/tastepin/library"),
    );
    const body = tastepinLibraryResponseSchema.parse(await response.json());

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.mode).toBe("demo");
    expect(body.collection.visibility).toBe("private");
    expect(body.places.length).toBeGreaterThan(3);
    expect(body.places.some((place) => place.source.platform === "youtube_shorts")).toBe(true);
    expect(body.places.every((place) => place.mapUrl.startsWith("https://www.google.com/maps/"))).toBe(true);
    expect(body.origin.mode).toBe("demo_station");
    expect(body.ranking).toEqual(expect.objectContaining({
      metric: "youtube_total_views",
      label: "공개 YouTube 누적 조회수",
    }));
    expect(body.places.some((place) => place.youtubeMentions.length === 0)).toBe(true);
    expect(body.places.every((place) =>
      place.youtubeMentions.every((video) =>
        video.url === `https://www.youtube.com/watch?v=${video.id}`
      )
    )).toBe(true);
    expect(body.places.filter((place) => place.area === "강남역")).toHaveLength(4);
    expect(body.places.filter((place) => place.area === "역삼역")).toHaveLength(4);
    expect(body.stationCollections).toEqual([
      expect.objectContaining({
        id: "gangnam-station",
        station: "강남역",
        title: "강남역 모음",
        placeIds: expect.arrayContaining([
          "gangnam-tamtam",
          "gangnam-jangin",
          "gangnam-jeonseol-woodaegalbi",
          "gangnam-myeongdong-kalguksu",
        ]),
      }),
      expect.objectContaining({
        id: "yeoksam-station",
        station: "역삼역",
        title: "역삼역 모음",
        placeIds: expect.arrayContaining([
          "yeoksam-daewoo",
          "yeoksam-dotgogi",
          "yeoksam-chisot",
          "yeoksam-sanjang",
        ]),
      }),
      expect.objectContaining({
        id: "sinnonhyeon-station",
        station: "신논현역",
        title: "신논현역 모음",
        placeIds: ["gangnam-jeonseol-woodaegalbi"],
      }),
    ]);
    expect(body.stationCollections).toHaveLength(3);
    expect(body.stationCollections.every((collection) => collection.placeIds.length > 0)).toBe(true);
    const stationPlaces = body.places.filter((place) => (
      place.area === "강남역" || place.area === "역삼역"
    ));
    expect(stationPlaces.every((place) =>
      place.youtubeMentions.every((mention) =>
        mention.viewCount !== null && mention.publishedAt !== null
      )
    )).toBe(true);
    expect(body.places.find((place) => place.id === "yeoksam-daewoo")?.youtubeMentions.reduce(
      (total, mention) => total + (mention.viewCount ?? 0),
      0,
    )).toBe(2_001_746);
    const instagramMentions = body.places.flatMap((place) => place.instagramMentions);
    expect(instagramMentions).toHaveLength(4);
    expect(instagramMentions.map((mention) => mention.kind).sort()).toEqual([
      "post",
      "reel",
      "reel",
      "reel",
    ]);
    expect(instagramMentions.find((mention) => mention.id === "DbTBhcZNY1b")?.publishedAt)
      .toBe("2026-07-27");
    expect(body.places.find((place) => place.id === "gangnam-jeonseol-woodaegalbi")
      ?.youtubeMentions[0]).toEqual(expect.objectContaining({
      publishedAt: "2026-07-28",
      viewCount: 193,
    }));
    expect(instagramMentions.every((mention) =>
      mention.embedUrl === `${mention.url}embed/captioned/`
    )).toBe(true);
    expect(body.places.filter((place) => place.instagramMentions.length > 0).every(
      (place) => place.source.url === place.instagramMentions[0]?.url,
    )).toBe(true);
    expect(body.places.map((place) => place.distanceMeters)).toEqual(
      [...body.places].map((place) => place.distanceMeters).sort((a, b) => a - b),
    );
  });

  it("uses device coordinates when provided and keeps location out of storage", async () => {
    const response = await GET(
      new Request("http://localhost/api/tastepin/library?lat=37.5168&lng=127.0361"),
    );
    const body = tastepinLibraryResponseSchema.parse(await response.json());

    expect(body.origin.mode).toBe("device");
    expect(body.origin.label).toBe("내 위치 주변");
    expect(body.places[0].id).toBe("gangnam-noodle");
    expect(body.places[0].distanceMeters).toBe(0);
  });
});

describe("tastepin distance", () => {
  it("calculates and formats nearby distances", () => {
    const distance = distanceInMeters(
      { latitude: 37.5446, longitude: 127.0559 },
      { latitude: 37.5428, longitude: 127.0545 },
    );

    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(300);
    expect(formatDistance(distance)).toMatch(/m$/);
    expect(formatDistance(1_250)).toBe("1.3km");
  });
});
