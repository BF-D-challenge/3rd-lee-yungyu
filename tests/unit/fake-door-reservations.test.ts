import { describe, expect, it } from "vitest";
import {
  FAKE_DOOR_LEAD_PRIVACY_VERSION,
  fakeDoorProductConfigs,
  fakeDoorProductSchema,
  fakeDoorReservationSchema,
} from "@/lib/fake-door-reservation-contract";

const leadFields = {
  contact_consent_at: "2026-08-01T00:00:00.000Z",
  privacy_version: FAKE_DOOR_LEAD_PRIVACY_VERSION,
  acquisition_source: "instagram",
  utm_source: "meta",
  utm_medium: "paid_social",
  utm_campaign: "launch",
  utm_content: null,
  utm_term: null,
} as const;

describe("fake door reservation contract", () => {
  it("supports the four current MVPs only", () => {
    expect(Object.keys(fakeDoorProductConfigs)).toEqual([
      "matpick",
      "onebite",
      "today",
      "story-cards",
    ]);
    expect(fakeDoorProductSchema.safeParse("today-a").success).toBe(false);
    expect(fakeDoorProductConfigs["story-cards"].name).toBe("카드너머");
    expect(fakeDoorProductConfigs.matpick.name).toBe("맛핀");
    expect(fakeDoorProductConfigs.onebite.requiresInstagram).toBe(true);
    expect(fakeDoorProductConfigs.matpick.requiresInstagram).toBe(true);
    expect(Object.values(fakeDoorProductConfigs).every((config) =>
      !config.description.includes("바로 대화")
      && !config.description.includes("24시간 뒤"),
    )).toBe(true);
  });

  it("requires an authenticated UUID-shaped owner", () => {
    expect(fakeDoorReservationSchema.safeParse({
      id: "f60112fc-49e0-471b-89c8-16a649a1ad55",
      user_id: "ce4491a8-e5e3-4d53-93cf-c3411ed72f0a",
      product: "today",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/today",
      instagram_handle: "not_needed",
      ...leadFields,
      created_at: "2026-07-29T00:00:00.000Z",
      updated_at: "2026-07-29T00:00:00.000Z",
    }).success).toBe(false);
    expect(fakeDoorReservationSchema.safeParse({
      id: "f60112fc-49e0-471b-89c8-16a649a1ad55",
      user_id: "ce4491a8-e5e3-4d53-93cf-c3411ed72f0a",
      product: "onebite",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/onebite",
      instagram_handle: "my.daily_meal",
      ...leadFields,
      created_at: "2026-07-29T00:00:00.000Z",
      updated_at: "2026-07-29T00:00:00.000Z",
    }).success).toBe(true);
    expect(fakeDoorReservationSchema.safeParse({
      id: "not-a-uuid",
      user_id: "anonymous",
      product: "onebite",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/onebite",
      ...leadFields,
      created_at: "2026-07-29T00:00:00.000Z",
      updated_at: "2026-07-29T00:00:00.000Z",
    }).success).toBe(false);
    expect(fakeDoorReservationSchema.safeParse({
      id: "f60112fc-49e0-471b-89c8-16a649a1ad55",
      user_id: "ce4491a8-e5e3-4d53-93cf-c3411ed72f0a",
      product: "matpick",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/matpick",
      instagram_handle: null,
      ...leadFields,
      created_at: "2026-07-29T00:00:00.000Z",
      updated_at: "2026-07-29T00:00:00.000Z",
    }).success).toBe(false);
    expect(fakeDoorReservationSchema.safeParse({
      id: "f60112fc-49e0-471b-89c8-16a649a1ad55",
      user_id: "ce4491a8-e5e3-4d53-93cf-c3411ed72f0a",
      product: "onebite",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/onebite",
      instagram_handle: null,
      ...leadFields,
      created_at: "2026-07-29T00:00:00.000Z",
      updated_at: "2026-07-29T00:00:00.000Z",
    }).success).toBe(false);
    expect(fakeDoorReservationSchema.safeParse({
      id: "f60112fc-49e0-471b-89c8-16a649a1ad55",
      user_id: "ce4491a8-e5e3-4d53-93cf-c3411ed72f0a",
      product: "onebite",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/onebite",
      instagram_handle: "아이디에 공백",
      ...leadFields,
      created_at: "2026-07-29T00:00:00.000Z",
      updated_at: "2026-07-29T00:00:00.000Z",
    }).success).toBe(false);
  });

  it("requires explicit lead consent and bounded non-PII attribution", () => {
    const base = {
      id: "f60112fc-49e0-471b-89c8-16a649a1ad55",
      user_id: "ce4491a8-e5e3-4d53-93cf-c3411ed72f0a",
      product: "today",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/today",
      instagram_handle: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    } as const;

    expect(fakeDoorReservationSchema.safeParse({ ...base, ...leadFields }).success).toBe(true);
    expect(fakeDoorReservationSchema.safeParse(base).success).toBe(false);
    expect(fakeDoorReservationSchema.safeParse({
      ...base,
      ...leadFields,
      privacy_version: "outdated",
    }).success).toBe(false);
    expect(fakeDoorReservationSchema.safeParse({
      ...base,
      ...leadFields,
      utm_campaign: "a".repeat(121),
    }).success).toBe(false);
  });
});
