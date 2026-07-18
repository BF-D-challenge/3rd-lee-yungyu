# 배포 가이드 — Supabase + Vercel

> 운영 프로젝트: `fjhnwwdfuhmsffkvlbbo`(서울 리전).
> 응원 보안 전환은 반드시 **새 API 준비 → 새 웹앱 배포 → 옛 직접 접근 차단** 순서로 진행한다.

---

## 1. Supabase — 안전한 응원 게이트 ✅ 준비됨

- `secure_feedback_gateway`와 `optimize_owner_rls` 마이그레이션이 운영 DB에 적용됐다.
- `feedback-api` Edge Function v1이 `ACTIVE`다. 공개 JWT 대신 링크마다 다른 무작위 쓰기·읽기 토큰을 함수 본문에서 검증한다.
- 합성 왕복 검증: 등록 `201`, 정상 투표·소유자 읽기 `200`, 잘못된 토큰과 쓰기 토큰의 읽기 시도 `401`.
- 합성 데이터는 검증 직후 삭제했다.

### 아직 적용하면 안 되는 마지막 잠금

[`20260718020000_lock_direct_feedback_access.sql`](../supabase/migrations/20260718020000_lock_direct_feedback_access.sql)은 새 웹앱 운영 배포가 확인된 뒤에만 적용한다. 먼저 적용하면 현재 운영 중인 구버전 웹앱의 응원 기능이 멈춘다.

1. 이 코드가 포함된 웹앱을 Vercel 운영 환경에 배포한다.
2. 새 카드 링크를 만들고 다른 브라우저에서 응원한 뒤, 만든 브라우저에서 결과가 보이는지 확인한다.
3. 위 잠금 마이그레이션을 적용한다.
4. 익명 키로 `card_votes`·`duel_votes`를 직접 읽고 쓰는 요청이 `401/403`인지 확인한다.
5. Supabase Security Advisor에서 `card_votes`·`duel_votes`의 permissive policy 경고가 사라졌는지 확인한다.

## 2. 구글 로그인 (선택 — 안 하면 데모는 가짜 통과로 계속 동작)

발행(S3)에서 실제 구글 로그인을 켜려면:
1. Supabase 대시보드 → Authentication → Providers → **Google** 활성화.
2. Google Cloud Console에서 OAuth 클라이언트(웹) 생성 → Client ID/Secret을 Supabase Google provider에 입력.
3. 승인된 리디렉션 URI에 `https://fjhnwwdfuhmsffkvlbbo.supabase.co/auth/v1/callback` 추가.
4. Supabase Auth → URL Configuration:
   - Site URL: `https://bfd-seven.vercel.app`
   - Redirect URLs: `https://bfd-seven.vercel.app/auth/callback`
   - 로컬 검증이 필요하면 `http://localhost:3000/auth/callback`과 `http://127.0.0.1:3000/auth/callback`도 추가.
   - 운영에서는 `/**` 전체 허용 대신 위 콜백 경로만 정확히 허용한다.
5. **위 1~4를 마친 뒤에만** env에 `GOOGLE_LOGIN=1` 추가(로컬 `.env` + Vercel). 그래야 발행 화면이 실제 OAuth를 쓴다.
- ⚠ `GOOGLE_LOGIN=1`을 provider 설정 **전에** 켜면, 로그인 클릭이 Supabase 인증 URL로 리다이렉트되며 에러 페이지로 이탈한다(발행 불가). 그래서 기본값은 꺼짐 = 가짜 통과(발행 계속 동작). 투표/응원은 이 플래그와 무관하게 Supabase로 이미 동작.

## 3. Vercel 배포 (5분)

1. https://vercel.com/new → 이 GitHub 레포 Import (Framework: Next.js 자동 감지).
2. **Environment Variables**에 3개 추가(값은 로컬 `.env`에 있는 것 그대로):
   - `SUPABASE_URL` = `https://fjhnwwdfuhmsffkvlbbo.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = (로컬 .env의 그 값 — publishable/anon 키, 공개 안전)
   - `GOOGLE_LOGIN` = `1`
   - ※ `next.config.mjs`가 이 값들을 브라우저용 `NEXT_PUBLIC_*`로 브릿지하므로 이 이름 그대로 넣으면 됨.
3. Deploy.

### 로컬 실행
`.env`에 `SUPABASE_URL`·`SUPABASE_PUBLISHABLE_KEY`가 이미 있으므로 `npm run dev` 그대로. (없으면 localStorage 폴백으로 동작하되 응원은 발행자에게 안 감.)

---

## 동작 원리

- 공유받은 사람의 URL에는 **응원 쓰기 토큰만** 들어간다.
- 만든 사람의 브라우저·본인 전용 `published_cards` 행에는 **결과 읽기 토큰**을 따로 보관한다.
- 브라우저는 투표 테이블을 직접 만지지 않고 `feedback-api`만 호출한다. 함수는 토큰 해시·중복·요청량 제한을 확인한 뒤 service role로 최소 작업만 수행한다.
- DB에는 원문 토큰·브라우저 UUID·사용자 ID를 그대로 저장하지 않고 해시만 남긴다.
- Supabase 미설정 시 `lib/votes.ts`가 전부 localStorage로 폴백 → 데모는 항상 동작(단 응원 도달은 서버 있을 때만).

## 남은 정식화 (이후)
- 실명 리빌(God Mode)·결제(PG)·spins 캡·이메일은 별도 스프린트(피벗 계획 P2+, 기존 schema.sql 확장).
