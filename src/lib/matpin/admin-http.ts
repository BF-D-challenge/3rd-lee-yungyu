import { NextResponse } from "next/server";
import type { MatpinAdminAccess } from "@/lib/matpin/admin-auth";

export const MATPIN_ADMIN_HEADERS = {
  "cache-control": "private, no-store, max-age=0",
  pragma: "no-cache",
} as const;

export function matpinAdminJson(value: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  Object.entries(MATPIN_ADMIN_HEADERS).forEach(([key, headerValue]) => headers.set(key, headerValue));
  return NextResponse.json(value, { ...init, headers });
}

export function matpinAdminAccessError(access: Exclude<MatpinAdminAccess, { state: "authorized" }>) {
  if (access.state === "unauthenticated") {
    return matpinAdminJson({ error: "unauthenticated" }, { status: 401 });
  }
  if (access.state === "not_configured") {
    return matpinAdminJson({ error: "admin_not_configured" }, { status: 403 });
  }
  return matpinAdminJson({ error: "forbidden" }, { status: 403 });
}

export function matpinAdminErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown_error";
  return message.split(":", 1)[0].replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "unknown_error";
}

export function matpinAdminOperationError(error: unknown) {
  const code = matpinAdminErrorCode(error);
  const status = code.includes("invalid") ? 400
    : code.includes("unavailable") || code.includes("window_closed") ? 409
    : code.includes("in_progress") || code.includes("already_failed") || code.includes("mismatch") ? 409
        : code.includes("not_configured") ? 503
          : code.startsWith("meta_admin_fetch_failed") ? 502
            : 500;
  return matpinAdminJson({ error: code }, { status });
}
