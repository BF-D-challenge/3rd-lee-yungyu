import { beforeEach, describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => ({
  getSupabase: vi.fn(),
}));

vi.mock("@/lib/backend/client", () => ({
  getSupabase: backend.getSupabase,
}));

import type { AuthSession } from "@/lib/auth-session";
import type { FakeDoorTestProduct } from "@/lib/fake-door-reservation-contract";
import {
  findFakeDoorReservation,
  loadPendingContactConsent,
  readReservationAttribution,
  saveFakeDoorReservation,
  savePendingContactConsent,
} from "@/lib/fake-door-reservation-store";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const productsWithoutInstagram: FakeDoorTestProduct[] = [
  "today",
  "story-cards",
];

const productsWithInstagram = [
  { product: "matpick", handle: "matpin_test" },
  { product: "onebite", handle: "onebite_test" },
] as const;

const demoSession: AuthSession = {
  actorId: "11111111-1111-4111-8111-111111111111",
  authenticated: true,
  demo: true,
};

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("sessionStorage", new MemoryStorage());
  backend.getSupabase.mockReset();
  backend.getSupabase.mockReturnValue(null);
});

const consentFor = (product: FakeDoorTestProduct) => {
  const consent = savePendingContactConsent(product, true);
  if (!consent) throw new Error("test_contact_consent_not_saved");
  return consent;
};

describe("fake door reservation storage", () => {
  it.each(productsWithInstagram)(
    "saves and reads back $product with its Instagram handle",
    async ({ product, handle }) => {
      const saved = await saveFakeDoorReservation(demoSession, {
        product,
        slotKey: "next-week",
        sourcePath: `/reserve/${product}?from=e2e`,
        instagramHandle: `@${handle}`,
        contactConsent: consentFor(product),
      });

      expect(saved.mode).toBe("local_demo");
      expect(saved.reservation.instagram_handle).toBe(handle);
      await expect(findFakeDoorReservation(demoSession, product)).resolves.toEqual(
        saved.reservation,
      );
    },
  );

  it.each(productsWithoutInstagram)("saves and reads back %s without Instagram", async (product) => {
    const saved = await saveFakeDoorReservation(demoSession, {
      product,
      slotKey: "next-week",
      sourcePath: `/reserve/${product}?from=e2e`,
      contactConsent: consentFor(product),
    });

    expect(saved.reservation.instagram_handle).toBeNull();
    await expect(findFakeDoorReservation(demoSession, product)).resolves.toEqual(
      saved.reservation,
    );
  });

  it("does not store an Instagram handle for products that do not ask for it", async () => {
    const saved = await saveFakeDoorReservation(demoSession, {
      product: "today",
      slotKey: "this-week",
      sourcePath: "/reserve/today",
      instagramHandle: "should_not_be_stored",
      contactConsent: consentFor("today"),
    });

    expect(saved.reservation.instagram_handle).toBeNull();
  });

  it.each(productsWithInstagram)(
    "rejects $product without a valid Instagram handle",
    async ({ product }) => {
      await expect(saveFakeDoorReservation(demoSession, {
        product,
        slotKey: "this-week",
        sourcePath: `/reserve/${product}`,
        contactConsent: null,
      })).rejects.toThrow("invalid_instagram_handle");
      await expect(saveFakeDoorReservation(demoSession, {
        product,
        slotKey: "this-week",
        sourcePath: `/reserve/${product}`,
        instagramHandle: "invalid handle",
        contactConsent: null,
      })).rejects.toThrow("invalid_instagram_handle");
    },
  );

  it("requires a current product-specific contact consent record", async () => {
    await expect(saveFakeDoorReservation(demoSession, {
      product: "today",
      slotKey: "this-week",
      sourcePath: "/reserve/today",
      contactConsent: null,
    })).rejects.toThrow("contact_consent_required");

    const matpickConsent = consentFor("matpick");
    await expect(saveFakeDoorReservation(demoSession, {
      product: "today",
      slotKey: "this-week",
      sourcePath: "/reserve/today",
      contactConsent: matpickConsent,
    })).rejects.toThrow("invalid_contact_consent");
  });

  it("restores consent across OAuth and keeps bounded first-touch attribution", () => {
    const consent = consentFor("matpick");
    sessionStorage.setItem("analytics:acquisition:v1", JSON.stringify({
      source: "instagram",
      utm_source: "instagram",
      utm_medium: "paid_social",
      utm_campaign: "launch",
      utm_content: "a".repeat(160),
      utm_term: "not_set",
    }));

    expect(loadPendingContactConsent("matpick")).toEqual(consent);
    expect(loadPendingContactConsent("onebite")).toBeNull();
    expect(readReservationAttribution()).toEqual({
      acquisition_source: "instagram",
      utm_source: "instagram",
      utm_medium: "paid_social",
      utm_campaign: "launch",
      utm_content: "a".repeat(120),
      utm_term: null,
    });
  });

  it("uses Supabase upsert and reads the authenticated user's row", async () => {
    const session: AuthSession = {
      actorId: "22222222-2222-4222-8222-222222222222",
      authenticated: true,
      demo: false,
    };
    const contactConsent = consentFor("today");
    sessionStorage.setItem("analytics:acquisition:v1", JSON.stringify({
      source: "instagram",
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "matpick_launch",
    }));
    const row = {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: session.actorId,
      product: "today",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/today",
      instagram_handle: null,
      contact_consent_at: contactConsent.agreedAt,
      privacy_version: contactConsent.privacyVersion,
      acquisition_source: "instagram",
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "matpick_launch",
      utm_content: null,
      utm_term: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    } as const;
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const upsertSelect = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select: upsertSelect });
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const statusEq = vi.fn().mockReturnValue({ maybeSingle });
    const productEq = vi.fn().mockReturnValue({ eq: statusEq });
    const userEq = vi.fn().mockReturnValue({ eq: productEq });
    const select = vi.fn().mockReturnValue({ eq: userEq });
    const from = vi.fn()
      .mockReturnValueOnce({ upsert })
      .mockReturnValueOnce({ select });
    backend.getSupabase.mockReturnValue({ from });

    const saved = await saveFakeDoorReservation(session, {
      product: "today",
      slotKey: "this-week",
      sourcePath: "/reserve/today",
      contactConsent,
    });
    const reread = await findFakeDoorReservation(session, "today");

    expect(saved).toEqual({ mode: "supabase", reservation: row });
    expect(reread).toEqual(row);
    expect(upsert).toHaveBeenCalledWith({
      user_id: session.actorId,
      product: "today",
      slot_key: "this-week",
      status: "reserved",
      source_path: "/reserve/today",
      instagram_handle: null,
      contact_consent_at: contactConsent.agreedAt,
      privacy_version: "2026-08-01",
      acquisition_source: "instagram",
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "matpick_launch",
      utm_content: null,
      utm_term: null,
    }, { onConflict: "user_id,product" });
    expect(userEq).toHaveBeenCalledWith("user_id", session.actorId);
  });
});
