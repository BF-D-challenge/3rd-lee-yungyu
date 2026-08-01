import { NextRequest, NextResponse } from "next/server";

const META_SERVER_EVENT_NAMES = [
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

const META_SERVER_CUSTOM_DATA_KEYS = [
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

const ALLOWED_EVENTS = new Set<string>(META_SERVER_EVENT_NAMES);
const ALLOWED_CUSTOM_DATA = new Set<string>(META_SERVER_CUSTOM_DATA_KEYS);
const PRODUCT_EVENTS = new Set([
  "CompleteRegistration",
  "MvpLandingView",
  "MvpPrimaryCta",
  "MvpInstagramInputStarted",
  "MvpReservationCompleted",
]);
const PRODUCT_IDS = new Set(["matpick", "onebite", "today", "story-cards"]);
const SAFE_ID = /^[A-Za-z0-9._:-]{1,120}$/;
const SAFE_VALUE = /^[A-Za-z0-9._~:/+-]{1,120}$/;
const SAFE_PATH = /^\/[^\s?]{0,500}$/;
const SAFE_GRAPH_VERSION = /^v\d{1,2}\.\d$/;
const SAFE_TEST_EVENT_CODE = /^TEST\d{1,20}$/;

type ClientEvent = {
  event_name?: unknown;
  event_id?: unknown;
  event_source_path?: unknown;
  custom_data?: unknown;
};

function sanitizedCustomData(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!ALLOWED_CUSTOM_DATA.has(key)) continue;
    if (typeof item === "string" && SAFE_VALUE.test(item)) result[key] = item;
    if (typeof item === "number" && Number.isFinite(item)) result[key] = item;
    if (key === "submit_success" && typeof item === "boolean") result[key] = item;
  }
  return result;
}

export async function POST(request: NextRequest) {
  const datasetId = process.env.META_DATASET_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!datasetId || !/^\d{5,20}$/.test(datasetId) || !accessToken) {
    return new NextResponse(null, { status: 204 });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "cross_site_request" }, { status: 403 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 8192) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: ClientEvent;
  try {
    body = JSON.parse(rawBody) as ClientEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.event_name !== "string"
    || !ALLOWED_EVENTS.has(body.event_name)
    || typeof body.event_id !== "string"
    || !SAFE_ID.test(body.event_id)
    || typeof body.event_source_path !== "string"
    || !SAFE_PATH.test(body.event_source_path)
  ) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const customData = sanitizedCustomData(body.custom_data);
  if (
    PRODUCT_EVENTS.has(body.event_name)
    && (typeof customData.product_id !== "string" || !PRODUCT_IDS.has(customData.product_id))
  ) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }
  if (
    body.event_name === "MvpReservationCompleted"
    && (customData.submit_success !== true || customData.storage_mode === "local_demo")
  ) {
    return NextResponse.json({ error: "invalid_reservation" }, { status: 400 });
  }

  const graphVersion = SAFE_GRAPH_VERSION.test(process.env.META_GRAPH_API_VERSION ?? "")
    ? process.env.META_GRAPH_API_VERSION!
    : "v25.0";
  const testEventCode = SAFE_TEST_EVENT_CODE.test(process.env.META_TEST_EVENT_CODE ?? "")
    ? process.env.META_TEST_EVENT_CODE
    : undefined;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent");
  const fbp = request.cookies.get("_fbp")?.value;
  const fbc = request.cookies.get("_fbc")?.value;
  const userData = {
    ...(forwardedFor ? { client_ip_address: forwardedFor } : {}),
    ...(userAgent ? { client_user_agent: userAgent } : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${datasetId}/events`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          data: [{
            event_name: body.event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_id: body.event_id,
            event_source_url: new URL(body.event_source_path, request.nextUrl.origin).toString(),
            action_source: "website",
            user_data: userData,
            custom_data: customData,
          }],
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
        }),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      console.error("[meta-capi] upstream_rejected", { status: response.status });
      return NextResponse.json({ error: "meta_upstream_error" }, { status: 502 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(
      "[meta-capi] unavailable",
      error instanceof Error ? error.message : "unknown_error",
    );
    return NextResponse.json({ error: "meta_unavailable" }, { status: 502 });
  }
}
