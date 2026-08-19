import { describe, expect, it } from "vitest";
import { normalizeInstagramHandle } from "@/lib/instagram-handle";
import { matpinPublicPlaceSchema, type MatpinPublicProfile } from "@/lib/matpin/contract";
import { matpinPublicProfileResponse } from "@/lib/matpin/public-profile";

const profile: MatpinPublicProfile = {
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
};

describe("Matpin public profile contract", () => {
  it("normalizes valid Instagram usernames and rejects malformed paths", () => {
    expect(normalizeInstagramHandle("@@My.Name")).toBe("my.name");
    for (const value of ["", ".name", "name.", "two..dots", "hyphen-name", "name/path", "한글"] ) {
      expect(normalizeInstagramHandle(value)).toBeNull();
    }
  });

  it("returns only the explicitly public place projection", () => {
    const response = matpinPublicProfileResponse(profile);
    expect(response).toEqual({
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

    const serialized = JSON.stringify(response);
    for (const secret of [
      "sender_hash",
      "sender_ciphertext",
      "access_token",
      "short_link_hash",
      "messageId",
      "confirmationSource",
      "savedAt",
    ]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("accepts only HTTPS links on approved map and Instagram hosts", () => {
    expect(matpinPublicPlaceSchema.safeParse(profile.places[0]).success).toBe(true);
    for (const mapUrl of [
      "javascript:alert(1)",
      "data:text/html,unsafe",
      "https://maps.google.com.evil.example/place",
      "ftp://maps.google.com/place",
    ]) {
      expect(matpinPublicPlaceSchema.safeParse({
        ...profile.places[0],
        place: { ...profile.places[0].place, mapUrl },
      }).success).toBe(false);
    }
    expect(matpinPublicPlaceSchema.safeParse({
      ...profile.places[0],
      reelUrl: "https://instagram.com.evil.example/p/Post_123/",
    }).success).toBe(false);
  });
});
