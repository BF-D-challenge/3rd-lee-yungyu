// Supabase 브라우저 클라이언트 (익명/publishable 키). RLS가 데이터를 보호하므로 공개 안전.
// env 브릿지: 개인 .env는 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 이름을 쓴다.
//   next.config.mjs가 이를 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 로 노출한다.
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** env가 있을 때만 활성. 미설정(로컬 데모)이면 null → 데이터층이 localStorage 폴백. */
export const supabaseEnabled = Boolean(url && anon);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (typeof window === "undefined") return null; // 브라우저 전용 경로만 사용
  if (!client) client = createBrowserClient(url!, anon!);
  return client;
}
