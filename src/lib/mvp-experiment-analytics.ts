import { track } from "./track";

export const MVP_PRODUCT_IDS = ["matpick", "onebite", "today", "story-cards"] as const;
export type MvpProductId = (typeof MVP_PRODUCT_IDS)[number];

/** Legacy IDs remain accepted until the product chats replace their existing calls. */
export type MvpExperimentId =
  | MvpProductId
  | "tastepin"
  | "today_a"
  | "today_b"
  | "story_cards";

export const MVP_FUNNEL_STAGES = [
  "landing_view",
  "primary_cta",
  "instagram_input_started",
  "login_completed",
  "reservation_completed",
] as const;
export type MvpFunnelStage = (typeof MVP_FUNNEL_STAGES)[number];

export type MvpFunnelProperties = {
  creative_id?: string;
  landing_variant?: string;
  slot_key?: string;
  storage_mode?: string;
  submit_success?: boolean;
};

type MvpDefinition = {
  productId: MvpProductId;
  productSlug: MvpProductId;
  path: string;
  events: {
    result: string;
    deepAction: string;
  };
};

export const MVP_DEFINITIONS: Record<MvpExperimentId, MvpDefinition> = {
  matpick: {
    productId: "matpick",
    productSlug: "matpick",
    path: "/matpick",
    events: {
      result: "matpick_result_viewed",
      deepAction: "matpick_place_followup_opened",
    },
  },
  tastepin: {
    productId: "matpick",
    productSlug: "matpick",
    path: "/matpick",
    events: {
      result: "tastepin_result_viewed",
      deepAction: "tastepin_place_followup_opened",
    },
  },
  onebite: {
    productId: "onebite",
    productSlug: "onebite",
    path: "/onebite",
    events: {
      result: "onebite_result_viewed",
      deepAction: "onebite_next_meal_commit_saved",
    },
  },
  today: {
    productId: "today",
    productSlug: "today",
    path: "/today",
    events: {
      result: "today_idea_result_viewed",
      deepAction: "today_production_applied",
    },
  },
  today_a: {
    productId: "today",
    productSlug: "today",
    path: "/today-a",
    events: {
      result: "today_a_result_viewed",
      deepAction: "today_a_structure_saved",
    },
  },
  today_b: {
    productId: "today",
    productSlug: "today",
    path: "/today-b",
    events: {
      result: "today_b_result_viewed",
      deepAction: "today_b_experiment_started",
    },
  },
  "story-cards": {
    productId: "story-cards",
    productSlug: "story-cards",
    path: "/story-cards",
    events: {
      result: "story_cards_result_viewed",
      deepAction: "story_cards_regeneration_completed",
    },
  },
  story_cards: {
    productId: "story-cards",
    productSlug: "story-cards",
    path: "/story-cards",
    events: {
      result: "story_cards_result_viewed",
      deepAction: "story_cards_regeneration_completed",
    },
  },
};

/** Source-event aliases document how existing product calls roll up to the shared funnel. */
export const MVP_FUNNEL_EVENT_MAP: Record<
  MvpProductId,
  Record<MvpFunnelStage, readonly string[]>
> = {
  matpick: {
    landing_view: ["landing_view", "tastepin_landing_viewed", "matpick_landing_viewed"],
    primary_cta: ["primary_cta", "tastepin_input_started", "matpick_primary_cta_clicked"],
    instagram_input_started: ["instagram_input_started", "matpick_instagram_input_started"],
    login_completed: ["login_completed", "tastepin_signup_completed", "matpick_login_completed"],
    reservation_completed: ["reservation_completed", "matpick_reservation_completed"],
  },
  onebite: {
    landing_view: ["landing_view", "onebite_landing_viewed", "onebite_fake_door_landing_viewed"],
    primary_cta: ["primary_cta", "onebite_input_started", "onebite_instagram_submitted"],
    instagram_input_started: ["instagram_input_started", "onebite_instagram_input_started"],
    login_completed: ["login_completed", "onebite_signup_completed", "onebite_login_completed"],
    reservation_completed: ["reservation_completed", "onebite_reservation_completed"],
  },
  today: {
    landing_view: ["landing_view", "today_landing_viewed", "today_a_landing_viewed", "today_b_landing_viewed"],
    primary_cta: ["primary_cta", "today_input_started", "today_a_input_started", "today_b_input_started"],
    instagram_input_started: ["instagram_input_started", "today_instagram_input_started"],
    login_completed: ["login_completed", "today_signup_completed", "today_a_signup_completed", "today_b_signup_completed"],
    reservation_completed: ["reservation_completed", "today_reservation_completed"],
  },
  "story-cards": {
    landing_view: ["landing_view", "story_cards_landing_viewed"],
    primary_cta: ["primary_cta", "story_cards_input_started"],
    instagram_input_started: ["instagram_input_started", "story_cards_instagram_input_started"],
    login_completed: ["login_completed", "story_cards_signup_completed"],
    reservation_completed: ["reservation_completed", "story_cards_reservation_completed"],
  },
};

const SIGNUP_PENDING_KEY = "mvp:signup-pending:v1";
const SIGNUP_PENDING_TTL_MS = 10 * 60 * 1_000;
const SAFE_DIMENSION = /^[A-Za-z0-9._~:/+-]{1,120}$/;

function safeDimension(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_DIMENSION.test(value) ? value : undefined;
}

function allowedProperties(properties: MvpFunnelProperties): MvpFunnelProperties {
  const creativeId = safeDimension(properties.creative_id);
  const landingVariant = safeDimension(properties.landing_variant);
  const slotKey = safeDimension(properties.slot_key);
  const storageMode = safeDimension(properties.storage_mode);
  return {
    ...(creativeId ? { creative_id: creativeId } : {}),
    ...(landingVariant ? { landing_variant: landingVariant } : {}),
    ...(slotKey ? { slot_key: slotKey } : {}),
    ...(storageMode ? { storage_mode: storageMode } : {}),
    ...(typeof properties.submit_success === "boolean"
      ? { submit_success: properties.submit_success }
      : {}),
  };
}

function productIdFor(experimentId: MvpExperimentId): MvpProductId {
  return MVP_DEFINITIONS[experimentId].productId;
}

/** Emits one of the five shared event names with bounded, non-personal dimensions only. */
export function trackMvpFunnelStage(
  productId: MvpProductId,
  stage: MvpFunnelStage,
  properties: MvpFunnelProperties = {},
): void {
  track(stage, {
    product_id: productId,
    ...allowedProperties(properties),
  });
}

export function trackMvpLandingViewed(
  experimentId: MvpExperimentId,
  properties: MvpFunnelProperties = {},
): void {
  trackMvpFunnelStage(productIdFor(experimentId), "landing_view", properties);
}

export function trackMvpPrimaryCta(
  experimentId: MvpExperimentId,
  properties: MvpFunnelProperties = {},
): void {
  trackMvpFunnelStage(productIdFor(experimentId), "primary_cta", properties);
}

/** Compatibility adapter: existing product input-start calls represent the first primary action. */
export function trackMvpInputStarted(
  experimentId: MvpExperimentId,
  properties: MvpFunnelProperties = {},
): void {
  trackMvpPrimaryCta(experimentId, properties);
}

export function trackMvpInstagramInputStarted(
  experimentId: MvpExperimentId,
  properties: MvpFunnelProperties = {},
): void {
  trackMvpFunnelStage(productIdFor(experimentId), "instagram_input_started", properties);
}

/** Result and deep-action analytics remain separate; neither is a reservation conversion. */
export function trackMvpResultViewed(experimentId: MvpExperimentId): void {
  const definition = MVP_DEFINITIONS[experimentId];
  track(definition.events.result, { product_id: definition.productId });
}

export function trackMvpDeepAction(experimentId: MvpExperimentId): void {
  const definition = MVP_DEFINITIONS[experimentId];
  track(definition.events.deepAction, { product_id: definition.productId });
}

export function trackMvpLoginCompleted(
  experimentId: MvpExperimentId,
  session: { authenticated: true; demo: boolean },
  properties: MvpFunnelProperties = {},
): boolean {
  if (session.demo) return false;
  trackMvpFunnelStage(productIdFor(experimentId), "login_completed", properties);
  return true;
}

export function trackMvpReservationCompleted(
  experimentId: MvpExperimentId,
  session: { authenticated: true; demo: boolean },
  properties: MvpFunnelProperties & {
    storage_mode: string;
    submit_success: boolean;
  },
): boolean {
  if (session.demo || properties.storage_mode === "local_demo" || !properties.submit_success) {
    return false;
  }
  trackMvpFunnelStage(productIdFor(experimentId), "reservation_completed", properties);
  return true;
}

/** Attribute an auth completion only to the product CTA that initiated it. */
export function markMvpSignupPending(experimentId: MvpExperimentId): void {
  try {
    sessionStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify({ experimentId, at: Date.now() }));
  } catch {
    // Auth itself remains available when session storage is blocked.
  }
}

/** Returns false for demos, existing sessions, expired attribution, or another product's CTA. */
export function trackMvpSignupCompleted(
  experimentId: MvpExperimentId,
  session: { authenticated: true; demo: boolean },
): boolean {
  if (session.demo) return false;
  try {
    const raw = sessionStorage.getItem(SIGNUP_PENDING_KEY);
    const pending = raw ? JSON.parse(raw) as { experimentId?: unknown; at?: unknown } : null;
    const valid = pending?.experimentId === experimentId
      && typeof pending.at === "number"
      && Date.now() - pending.at >= 0
      && Date.now() - pending.at <= SIGNUP_PENDING_TTL_MS;
    if (!valid) return false;
    sessionStorage.removeItem(SIGNUP_PENDING_KEY);
  } catch {
    return false;
  }
  return trackMvpLoginCompleted(experimentId, session);
}
