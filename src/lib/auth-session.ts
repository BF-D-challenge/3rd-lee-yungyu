import {
  authEnabled,
  getUser,
  signInAnonymously,
  signInWithGoogle,
  signOut,
} from "./backend/auth";
import { supabaseEnabled } from "./backend/client";

const DEMO_AUTH_KEY = "oneul:demo-auth";
const DEMO_ANONYMOUS_AUTH_KEY = "oneul:demo-anonymous-auth";
const DEMO_ACTOR_KEY = "oneul:demo-actor";
const AUTH_PENDING_KEY = "oneul:auth-pending";
const AUTH_TRACK_KEY = "oneul:auth-active";
const AUTH_RETURN_TO_KEY = "oneul:auth-return-to";
const AUTH_CALLBACK_PATH = "/auth/callback";
const AUTH_COMPLETE_PATH = "/auth/complete";
const AUTH_PENDING_TTL_MS = 10 * 60 * 1_000;

export interface AuthSession {
  actorId: string;
  authenticated: true;
  demo: boolean;
  anonymous?: boolean;
  displayName?: string;
}

export interface AuthSessionOptions {
  /** Supabase env가 있으면 데모로 우회하지 않고 실제 세션/OAuth만 사용한다. */
  requireSupabaseWhenConfigured?: boolean;
}

/** 예약 화면이 실제 OAuth/DB 모드인지, 브라우저 전용 데모 모드인지 표시할 때 쓴다. */
export const reservationUsesSupabase = supabaseEnabled;

export type AuthContext = "creator" | "receiver" | "matpin_data";

const safeReturnPath = (value: string): string => {
  if (typeof window === "undefined") return "/";
  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin) return "/";
    const path = `${target.pathname}${target.search}${target.hash}`;
    if (target.pathname === AUTH_CALLBACK_PATH || target.pathname === AUTH_COMPLETE_PATH) return "/";
    return path || "/";
  } catch {
    return "/";
  }
};

/**
 * OAuth 제공자에는 짧고 고정된 callback URL만 전달하고, 실제 복귀 경로는
 * 같은 탭의 sessionStorage에 보관한다. 긴 공유 slug가 OAuth URL과 허용 목록에
 * 그대로 노출되는 일을 막고 외부 도메인으로의 open redirect도 차단한다.
 */
export function prepareAuthRedirect(returnTo: string): string {
  try {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, safeReturnPath(returnTo));
  } catch {
    // 저장소가 막혀도 로그인은 계속하고 완료 뒤 홈으로 복귀한다.
  }
  return typeof window === "undefined"
    ? AUTH_CALLBACK_PATH
    : new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();
}

export function peekAuthReturnTo(): string {
  try {
    return safeReturnPath(sessionStorage.getItem(AUTH_RETURN_TO_KEY) ?? "/");
  } catch {
    return "/";
  }
}

export function consumeAuthReturnTo(): string {
  const returnTo = peekAuthReturnTo();
  try {
    sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  } catch {
    // 복귀 자체는 저장소 정리 실패와 무관하게 진행한다.
  }
  return returnTo;
}

const markAuthenticatedForTracking = () => {
  try {
    sessionStorage.setItem(AUTH_TRACK_KEY, "1");
  } catch {
    // Tracking falls back to explicit event properties.
  }
};

export function authenticatedForTracking(): boolean {
  try {
    return sessionStorage.getItem(AUTH_TRACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAuthPending(context: AuthContext): void {
  try {
    sessionStorage.setItem(AUTH_PENDING_KEY, JSON.stringify({ context, at: Date.now() }));
  } catch {
    // OAuth still works when session storage is blocked; only completion attribution is lost.
  }
}

export function consumeAuthPending(context: AuthContext): boolean {
  try {
    const raw = sessionStorage.getItem(AUTH_PENDING_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw) as { context?: string; at?: number };
    const fresh = typeof value.at === "number"
      && Number.isFinite(value.at)
      && Date.now() - value.at >= 0
      && Date.now() - value.at <= AUTH_PENDING_TTL_MS;
    if (!fresh) {
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      return false;
    }
    if (value.context !== context) return false;
    sessionStorage.removeItem(AUTH_PENDING_KEY);
    return true;
  } catch {
    return false;
  }
}

const randomId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const demoActorId = (): string => {
  try {
    const existing = localStorage.getItem(DEMO_ACTOR_KEY);
    if (existing && isUuid(existing)) return existing;
    const next = randomId();
    localStorage.setItem(DEMO_ACTOR_KEY, next);
    return next;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
};

const displayNameFrom = (metadata: Record<string, unknown> | undefined): string | undefined => {
  const value = [metadata?.name, metadata?.full_name, metadata?.preferred_username].find(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return value?.trim().replace(/님$/, "").slice(0, 16);
};

export async function checkAuthSession(
  options: AuthSessionOptions = {},
): Promise<AuthSession | null> {
  if (supabaseEnabled || authEnabled) {
    const user = await getUser();
    if (user) {
      const anonymous = user.is_anonymous === true;
      if (!anonymous) markAuthenticatedForTracking();
      return {
        actorId: user.id,
        authenticated: true,
        demo: false,
        anonymous,
        displayName: displayNameFrom(user.user_metadata as Record<string, unknown> | undefined),
      };
    }
    if (authEnabled || options.requireSupabaseWhenConfigured) return null;
  }

  try {
    if (localStorage.getItem(DEMO_AUTH_KEY) !== "1") return null;
  } catch {
    return null;
  }
  let anonymous = false;
  try {
    anonymous = localStorage.getItem(DEMO_ANONYMOUS_AUTH_KEY) === "1";
  } catch {
    // 데모 세션 자체는 유지한다.
  }
  if (!anonymous) markAuthenticatedForTracking();
  return { actorId: demoActorId(), authenticated: true, demo: true, anonymous };
}

export type BeginAuthResult =
  | { status: "authenticated"; session: AuthSession }
  | { status: "redirecting" }
  | { status: "error"; error: string };

export async function beginAuth(
  redirectTo: string,
  options: AuthSessionOptions = {},
): Promise<BeginAuthResult> {
  if (authEnabled || (options.requireSupabaseWhenConfigured && supabaseEnabled)) {
    const { error } = await signInWithGoogle(prepareAuthRedirect(redirectTo));
    return error ? { status: "error", error } : { status: "redirecting" };
  }

  try {
    localStorage.setItem(DEMO_AUTH_KEY, "1");
    localStorage.removeItem(DEMO_ANONYMOUS_AUTH_KEY);
  } catch {
    return { status: "error", error: "브라우저 저장소를 사용할 수 없어요." };
  }
  markAuthenticatedForTracking();
  return {
    status: "authenticated",
    session: { actorId: demoActorId(), authenticated: true, demo: true },
  };
}

/**
 * 이메일 로그인이 필요 없는 fake-door 예약용 세션을 만든다.
 * Supabase 환경에서는 RLS 소유권을 유지하는 익명 Auth 사용자, 로컬에서는 데모 사용자를 쓴다.
 */
export async function beginAnonymousAuth(): Promise<BeginAuthResult> {
  if (supabaseEnabled) {
    const { user, error } = await signInAnonymously();
    if (error || !user) {
      return { status: "error", error: error ?? "익명 예약 세션을 만들지 못했어요." };
    }
    return {
      status: "authenticated",
      session: {
        actorId: user.id,
        authenticated: true,
        demo: false,
        anonymous: true,
      },
    };
  }

  try {
    localStorage.setItem(DEMO_AUTH_KEY, "1");
    localStorage.setItem(DEMO_ANONYMOUS_AUTH_KEY, "1");
  } catch {
    return { status: "error", error: "브라우저 저장소를 사용할 수 없어요." };
  }
  return {
    status: "authenticated",
    session: {
      actorId: demoActorId(),
      authenticated: true,
      demo: true,
      anonymous: true,
    },
  };
}

/** 실제 OAuth와 로컬 데모 세션을 같은 계정 UI에서 안전하게 종료한다. */
export async function endAuthSession(): Promise<void> {
  try {
    await signOut();
  } finally {
    try {
      localStorage.removeItem(DEMO_AUTH_KEY);
      localStorage.removeItem(DEMO_ANONYMOUS_AUTH_KEY);
    } catch {
      // 브라우저 저장소가 막혀도 실제 Supabase 로그아웃 결과는 유지한다.
    }
    try {
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      sessionStorage.removeItem(AUTH_TRACK_KEY);
      sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    } catch {
      // 세션 저장소 정리는 로그아웃 완료 여부에 영향을 주지 않는다.
    }
  }
}
