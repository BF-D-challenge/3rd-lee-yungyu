"use client";

import type { AuthSession } from "./auth-session";
import {
  FAKE_DOOR_LEAD_PRIVACY_VERSION,
  fakeDoorProductConfigs,
  fakeDoorReservationAttributionSchema,
  fakeDoorReservationSchema,
  fakeDoorSlotSchema,
  type FakeDoorReservation,
  type FakeDoorReservationAttribution,
  type FakeDoorSlot,
  type FakeDoorTestProduct,
} from "./fake-door-reservation-contract";
import { getSupabase } from "./backend/client";
import { normalizeInstagramHandle } from "./instagram-handle";

const LOCAL_KEY = "oneul:fake-door-reservations:v1";
const ACQUISITION_KEY = "analytics:acquisition:v1";
const CONTACT_CONSENT_KEY_PREFIX = "oneul:fake-door-contact-consent:v1";
const CONTACT_CONSENT_TTL_MS = 24 * 60 * 60 * 1000;
const RESERVATION_SELECT = [
  "id",
  "user_id",
  "product",
  "slot_key",
  "status",
  "source_path",
  "instagram_handle",
  "contact_consent_at",
  "privacy_version",
  "acquisition_source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "created_at",
  "updated_at",
].join(",");

export interface PendingContactConsent {
  agreedAt: string;
  privacyVersion: typeof FAKE_DOOR_LEAD_PRIVACY_VERSION;
}

const contactConsentKey = (product: FakeDoorTestProduct) =>
  `${CONTACT_CONSENT_KEY_PREFIX}:${product}`;

export function loadPendingContactConsent(
  product: FakeDoorTestProduct,
): PendingContactConsent | null {
  try {
    const raw = sessionStorage.getItem(contactConsentKey(product));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingContactConsent>;
    const agreedAt = typeof value.agreedAt === "string" ? Date.parse(value.agreedAt) : Number.NaN;
    if (
      value.privacyVersion !== FAKE_DOOR_LEAD_PRIVACY_VERSION
      || !Number.isFinite(agreedAt)
      || agreedAt > Date.now() + 60_000
      || Date.now() - agreedAt > CONTACT_CONSENT_TTL_MS
    ) {
      sessionStorage.removeItem(contactConsentKey(product));
      return null;
    }
    return {
      agreedAt: new Date(agreedAt).toISOString(),
      privacyVersion: FAKE_DOOR_LEAD_PRIVACY_VERSION,
    };
  } catch {
    return null;
  }
}

export function savePendingContactConsent(
  product: FakeDoorTestProduct,
  agreed: boolean,
  now = new Date(),
): PendingContactConsent | null {
  try {
    if (!agreed) {
      sessionStorage.removeItem(contactConsentKey(product));
      return null;
    }
    const value: PendingContactConsent = {
      agreedAt: now.toISOString(),
      privacyVersion: FAKE_DOOR_LEAD_PRIVACY_VERSION,
    };
    sessionStorage.setItem(contactConsentKey(product), JSON.stringify(value));
    return value;
  } catch {
    return null;
  }
}

export function clearPendingContactConsent(product: FakeDoorTestProduct): void {
  try {
    sessionStorage.removeItem(contactConsentKey(product));
  } catch {
    // Storage may be unavailable in privacy-restricted browsers.
  }
}

const cleanAttributionValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized === "not_set") return null;
  return normalized.slice(0, 120);
};

export function readReservationAttribution(): FakeDoorReservationAttribution {
  const empty = fakeDoorReservationAttributionSchema.parse({
    acquisition_source: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  });
  try {
    const raw = sessionStorage.getItem(ACQUISITION_KEY);
    if (!raw) return empty;
    const value = JSON.parse(raw) as Record<string, unknown>;
    return fakeDoorReservationAttributionSchema.parse({
      acquisition_source: cleanAttributionValue(value.source),
      utm_source: cleanAttributionValue(value.utm_source),
      utm_medium: cleanAttributionValue(value.utm_medium),
      utm_campaign: cleanAttributionValue(value.utm_campaign),
      utm_content: cleanAttributionValue(value.utm_content),
      utm_term: cleanAttributionValue(value.utm_term),
    });
  } catch {
    return empty;
  }
}

const localReservations = (): FakeDoorReservation[] => {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => fakeDoorReservationSchema.safeParse(item))
      .filter((item) => item.success)
      .map((item) => item.data);
  } catch {
    return [];
  }
};

const saveLocalReservation = (
  session: AuthSession,
  product: FakeDoorTestProduct,
  slotKey: FakeDoorSlot,
  sourcePath: string,
  instagramHandle: string | null,
  contactConsent: PendingContactConsent,
  attribution: FakeDoorReservationAttribution,
): FakeDoorReservation => {
  const now = new Date().toISOString();
  const previous = localReservations();
  const existing = previous.find(
    (reservation) => reservation.user_id === session.actorId && reservation.product === product,
  );
  const reservation: FakeDoorReservation = {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: session.actorId,
    product,
    slot_key: slotKey,
    status: "reserved",
    source_path: sourcePath,
    instagram_handle: instagramHandle,
    contact_consent_at: contactConsent.agreedAt,
    privacy_version: contactConsent.privacyVersion,
    ...attribution,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  const next = [
    ...previous.filter(
      (item) => !(item.user_id === session.actorId && item.product === product),
    ),
    reservation,
  ];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next.slice(-20)));
  return reservation;
};

export async function findFakeDoorReservation(
  session: AuthSession,
  product: FakeDoorTestProduct,
): Promise<FakeDoorReservation | null> {
  if (session.demo) {
    return localReservations().find(
      (item) =>
        item.user_id === session.actorId
        && item.product === product
        && item.status === "reserved",
    ) ?? null;
  }

  const client = getSupabase();
  if (!client) throw new Error("reservation_backend_unavailable");
  const { data, error } = await client
    .from("fake_door_reservations")
    .select(RESERVATION_SELECT)
    .eq("user_id", session.actorId)
    .eq("product", product)
    .eq("status", "reserved")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = fakeDoorReservationSchema.safeParse(data);
  if (!parsed.success) throw new Error("invalid_reservation_response");
  return parsed.data;
}

export async function saveFakeDoorReservation(
  session: AuthSession,
  input: {
    product: FakeDoorTestProduct;
    slotKey: FakeDoorSlot;
    sourcePath: string;
    instagramHandle?: string | null;
    contactConsent: PendingContactConsent | null;
  },
): Promise<{ mode: "supabase" | "local_demo"; reservation: FakeDoorReservation }> {
  const slotKey = fakeDoorSlotSchema.parse(input.slotKey);
  const sourcePath = input.sourcePath.slice(0, 240);
  const requiresInstagram = fakeDoorProductConfigs[input.product].requiresInstagram;
  const rawInstagramHandle = input.instagramHandle?.trim() ?? "";
  const instagramHandle = requiresInstagram
    ? normalizeInstagramHandle(rawInstagramHandle)
    : null;
  if (requiresInstagram && !instagramHandle) {
    throw new Error("invalid_instagram_handle");
  }
  if (!input.contactConsent) {
    throw new Error("contact_consent_required");
  }
  const contactConsent = loadPendingContactConsent(input.product);
  if (
    !contactConsent
    || contactConsent.agreedAt !== input.contactConsent.agreedAt
    || contactConsent.privacyVersion !== input.contactConsent.privacyVersion
  ) {
    throw new Error("invalid_contact_consent");
  }
  const attribution = readReservationAttribution();

  if (session.demo) {
    return {
      mode: "local_demo",
      reservation: saveLocalReservation(
        session,
        input.product,
        slotKey,
        sourcePath,
        instagramHandle,
        contactConsent,
        attribution,
      ),
    };
  }

  const client = getSupabase();
  if (!client) throw new Error("reservation_backend_unavailable");
  const payload = {
    user_id: session.actorId,
    product: input.product,
    slot_key: slotKey,
    status: "reserved" as const,
    source_path: sourcePath,
    instagram_handle: instagramHandle,
    contact_consent_at: contactConsent.agreedAt,
    privacy_version: contactConsent.privacyVersion,
    ...attribution,
  };
  const { data, error } = await client
    .from("fake_door_reservations")
    .upsert(payload, { onConflict: "user_id,product" })
    .select(RESERVATION_SELECT)
    .single();
  if (error) throw error;
  const parsed = fakeDoorReservationSchema.safeParse(data);
  if (!parsed.success) throw new Error("invalid_reservation_response");
  return { mode: "supabase", reservation: parsed.data };
}
