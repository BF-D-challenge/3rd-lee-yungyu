import { authEnabled, getUser, signInWithGoogle } from "./backend/auth";

const DEMO_AUTH_KEY = "oneul:demo-auth";
const DEMO_ACTOR_KEY = "oneul:demo-actor";
const AUTH_PENDING_KEY = "oneul:auth-pending";
const AUTH_TRACK_KEY = "oneul:auth-active";

export interface AuthSession {
  actorId: string;
  authenticated: true;
  demo: boolean;
  displayName?: string;
}

export type AuthContext = "creator" | "receiver";

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

const demoActorId = (): string => {
  try {
    const existing = localStorage.getItem(DEMO_ACTOR_KEY);
    if (existing) return existing;
    const next = randomId();
    localStorage.setItem(DEMO_ACTOR_KEY, next);
    return next;
  } catch {
    return "demo-anonymous";
  }
};

const displayNameFrom = (metadata: Record<string, unknown> | undefined): string | undefined => {
  const value = [metadata?.name, metadata?.full_name, metadata?.preferred_username].find(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return value?.trim().replace(/님$/, "").slice(0, 16);
};

export async function checkAuthSession(): Promise<AuthSession | null> {
  if (authEnabled) {
    const user = await getUser();
    if (!user) return null;
    markAuthenticatedForTracking();
    return {
      actorId: user.id,
      authenticated: true,
      demo: false,
      displayName: displayNameFrom(user.user_metadata as Record<string, unknown> | undefined),
    };
  }

  try {
    if (localStorage.getItem(DEMO_AUTH_KEY) !== "1") return null;
  } catch {
    return null;
  }
  markAuthenticatedForTracking();
  return { actorId: demoActorId(), authenticated: true, demo: true };
}

export type BeginAuthResult =
  | { status: "authenticated"; session: AuthSession }
  | { status: "redirecting" }
  | { status: "error"; error: string };

export async function beginAuth(redirectTo: string): Promise<BeginAuthResult> {
  if (authEnabled) {
    const { error } = await signInWithGoogle(redirectTo);
    return error ? { status: "error", error } : { status: "redirecting" };
  }

  try {
    localStorage.setItem(DEMO_AUTH_KEY, "1");
  } catch {
    return { status: "error", error: "브라우저 저장소를 사용할 수 없어요." };
  }
  markAuthenticatedForTracking();
  return {
    status: "authenticated",
    session: { actorId: demoActorId(), authenticated: true, demo: true },
  };
}
