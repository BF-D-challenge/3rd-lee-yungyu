"use client";

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    __metaPixelConfigured?: boolean;
  }
}

export const META_CLIENT_EVENT_NAMES = [
  "PageView",
  "ViewContent",
  "CompleteRegistration",
  "MvpLandingView",
  "MvpPrimaryCta",
  "MvpInstagramInputStarted",
  "MvpReservationCompleted",
  "IdeaSelected",
  "FirstActionPlanStarted",
] as const;

export const META_CLIENT_CUSTOM_DATA_KEYS = [
  "product_id",
  "creative_id",
  "landing_variant",
  "slot_key",
  "storage_mode",
  "submit_success",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type MetaEventName = (typeof META_CLIENT_EVENT_NAMES)[number];
type MetaParamValue = string | number | boolean | string[];

export type MetaConversion = {
  eventName: MetaEventName;
  standard: boolean;
  params: Record<string, MetaParamValue>;
};

const META_EVENT_ENDPOINT = "/api/meta/events";
const SAFE_DIMENSION = /^[A-Za-z0-9._~:/+-]{1,120}$/;
const PRODUCT_ALIASES: Record<string, "matpick" | "onebite" | "today" | "story-cards"> = {
  matpick: "matpick",
  tastepin: "matpick",
  onebite: "onebite",
  today: "today",
  today_a: "today",
  today_b: "today",
  "story-cards": "story-cards",
  story_cards: "story-cards",
};

const FUNNEL_META_EVENTS = {
  landing_view: { eventName: "MvpLandingView", standard: false },
  primary_cta: { eventName: "MvpPrimaryCta", standard: false },
  instagram_input_started: { eventName: "MvpInstagramInputStarted", standard: false },
  login_completed: { eventName: "CompleteRegistration", standard: true },
  reservation_completed: { eventName: "MvpReservationCompleted", standard: false },
} as const;

const PRODUCT_EVENT_ALIASES = new Map<string, keyof typeof FUNNEL_META_EVENTS>([
  ["tastepin_landing_viewed", "landing_view"],
  ["matpick_landing_viewed", "landing_view"],
  ["onebite_landing_viewed", "landing_view"],
  ["onebite_fake_door_landing_viewed", "landing_view"],
  ["today_landing_viewed", "landing_view"],
  ["today_a_landing_viewed", "landing_view"],
  ["today_b_landing_viewed", "landing_view"],
  ["story_cards_landing_viewed", "landing_view"],
  ["tastepin_input_started", "primary_cta"],
  ["matpick_primary_cta_clicked", "primary_cta"],
  ["onebite_input_started", "primary_cta"],
  ["onebite_instagram_submitted", "primary_cta"],
  ["today_input_started", "primary_cta"],
  ["today_a_input_started", "primary_cta"],
  ["today_b_input_started", "primary_cta"],
  ["story_cards_input_started", "primary_cta"],
  ["matpick_instagram_input_started", "instagram_input_started"],
  ["onebite_instagram_input_started", "instagram_input_started"],
  ["today_instagram_input_started", "instagram_input_started"],
  ["story_cards_instagram_input_started", "instagram_input_started"],
  ["tastepin_signup_completed", "login_completed"],
  ["matpick_login_completed", "login_completed"],
  ["onebite_signup_completed", "login_completed"],
  ["onebite_login_completed", "login_completed"],
  ["today_signup_completed", "login_completed"],
  ["today_a_signup_completed", "login_completed"],
  ["today_b_signup_completed", "login_completed"],
  ["story_cards_signup_completed", "login_completed"],
  ["matpick_reservation_completed", "reservation_completed"],
  ["onebite_reservation_completed", "reservation_completed"],
  ["today_reservation_completed", "reservation_completed"],
  ["story_cards_reservation_completed", "reservation_completed"],
]);

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_DIMENSION.test(value) ? value : undefined;
}

function productIdFrom(params: Record<string, unknown>): typeof PRODUCT_ALIASES[string] | undefined {
  const value = safeString(params.product_id) ?? safeString(params.product);
  return value ? PRODUCT_ALIASES[value] : undefined;
}

function allowedCustomData(
  params: Record<string, unknown>,
  productId?: typeof PRODUCT_ALIASES[string],
): Record<string, MetaParamValue> {
  const result: Record<string, MetaParamValue> = {};
  if (productId) result.product_id = productId;
  for (const key of META_CLIENT_CUSTOM_DATA_KEYS) {
    if (key === "product_id" || key === "submit_success") continue;
    const value = safeString(params[key]);
    if (value) result[key] = value;
  }
  if (typeof params.submit_success === "boolean") {
    result.submit_success = params.submit_success;
  }
  return result;
}

function funnelStageForEvent(event: string): keyof typeof FUNNEL_META_EVENTS | undefined {
  if (event in FUNNEL_META_EVENTS) return event as keyof typeof FUNNEL_META_EVENTS;
  if (event === "fake_door_reservation_login_completed") return "login_completed";
  if (event === "fake_door_reservation_completed") return "reservation_completed";
  return PRODUCT_EVENT_ALIASES.get(event);
}

/** Converts internal events to Meta's bounded contract; user-authored values are never copied. */
export function metaConversionForEvent(
  event: string,
  params: Record<string, unknown> = {},
): MetaConversion | null {
  const stage = funnelStageForEvent(event);
  if (stage) {
    const productId = productIdFrom(params);
    if (!productId) return null;
    if (stage === "login_completed" && params.method === "demo") return null;
    if (
      stage === "reservation_completed"
      && (params.storage_mode === "local_demo" || params.submit_success === false)
    ) {
      return null;
    }
    const contract = FUNNEL_META_EVENTS[stage];
    return {
      eventName: contract.eventName,
      standard: contract.standard,
      params: {
        ...allowedCustomData(params, productId),
        ...(stage === "reservation_completed" ? { submit_success: true } : {}),
      },
    };
  }

  const safeParams = allowedCustomData(params);
  switch (event) {
    case "idea_result_viewed":
      return { eventName: "ViewContent", standard: true, params: safeParams };
    case "idea_selected":
      return { eventName: "IdeaSelected", standard: false, params: safeParams };
    case "idea_first_action_started":
      return { eventName: "FirstActionPlanStarted", standard: false, params: safeParams };
    default:
      return null;
  }
}

const createEventId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `meta-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

const safeEventId = (value: unknown): string | undefined =>
  typeof value === "string" && /^[A-Za-z0-9._:-]{1,120}$/.test(value)
    ? value
    : undefined;

function emitMetaConversion(conversion: MetaConversion, sharedEventId?: string): void {
  if (typeof window === "undefined" || !window.__metaPixelConfigured || !window.fbq) return;

  const eventId = sharedEventId ?? createEventId();
  const command = conversion.standard ? "track" : "trackCustom";
  window.fbq(command, conversion.eventName, conversion.params, { eventID: eventId });

  void fetch(META_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event_name: conversion.eventName,
      event_id: eventId,
      event_source_path: window.location.pathname,
      custom_data: conversion.params,
    }),
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // CAPI failure must never block the product action or the browser event.
  });
}

export function trackMetaPageView(): void {
  emitMetaConversion({ eventName: "PageView", standard: true, params: {} });
}

export function trackMetaEvent(event: string, params: Record<string, unknown>): void {
  const conversion = metaConversionForEvent(event, params);
  if (conversion) emitMetaConversion(conversion, safeEventId(params.event_id));
}
