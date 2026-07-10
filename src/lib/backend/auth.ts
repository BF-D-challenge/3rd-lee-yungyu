// 구글 OAuth (Supabase Auth). v10에서는 제작자와 A/B 응원 수신자 모두 시작 전에 사용한다.
//   Supabase+Google provider가 설정돼 있으면 실제 OAuth, 아니면 호출부가 데모 세션으로 폴백.
import { getSupabase, supabaseEnabled } from "./client";
import type { User } from "@supabase/supabase-js";

// 실제 구글 로그인은 Supabase env + 구글 provider 설정 + 명시 플래그가 모두 갖춰졌을 때만.
//   signInWithOAuth는 provider 미설정이어도 브라우저를 리다이렉트시켜 앱을 이탈시키므로,
//   provider를 실제로 켠 뒤 GOOGLE_LOGIN=1을 세팅하기 전까지는 데모 가짜 통과를 유지한다(발행 계속 동작).
/** 실제 구글 로그인 활성 여부. false면 로그인 게이트가 데모 세션으로 폴백. */
export const authEnabled =
  supabaseEnabled && process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";

/** 구글 OAuth 시작. 성공 시 리다이렉트되므로 반환은 실패 시에만 의미. */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "auth-disabled" };
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo ?? (typeof window !== "undefined" ? window.location.href : undefined) },
  });
  return { error: error?.message ?? null };
}

export async function getUser(): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  await sb?.auth.signOut();
}
