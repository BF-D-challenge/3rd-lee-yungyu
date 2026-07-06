/** @type {import('next').NextConfig} */
// env 브릿지: 개인 .env의 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 를
//   브라우저가 읽는 NEXT_PUBLIC_* 로 노출한다. (Next는 next.config 평가 전에 .env 로드)
//   Vercel에서는 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 두 개만 넣으면 된다.
//   publishable(anon) 키는 공개 안전 — 데이터는 RLS로 보호.
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      "",
    // 구글 로그인 스위치: Supabase에 Google provider를 실제로 켠 뒤에만 "1"로.
    //   미설정이면 발행 로그인은 가짜 통과(데모 계속 동작), 투표는 Supabase 그대로 사용.
    NEXT_PUBLIC_GOOGLE_LOGIN:
      process.env.NEXT_PUBLIC_GOOGLE_LOGIN ?? process.env.GOOGLE_LOGIN ?? "",
  },
};

export default nextConfig;
