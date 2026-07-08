# 배포 가이드 — Supabase + Vercel

> 코드는 전부 준비됨. 아래 3가지는 **사용자 계정 권한이 필요한 단계**라 직접 해야 한다(내가 대신 못 함).
> ⚠ claude.ai Supabase MCP 사용 금지 — 반드시 **개인 대시보드**(프로젝트 `fjhnwwdfuhmsffkvlbbo`)로.

---

## 1. Supabase — 응원 테이블 ✅ 이미 적용됨

- [`supabase/votes-slug.sql`](../supabase/votes-slug.sql)(card_votes·duel_votes + RLS)를 **개인 프로젝트(서울 리전, ap-northeast-2)에 이미 적용 완료** — `.env`의 DB 비밀번호로 psql 직접 연결해 실행. 라이브 왕복(수신자 익명 insert → 1인1표 → 발행자 select) 검증됨.
- 재적용/다른 환경이 필요하면: https://supabase.com/dashboard/project/fjhnwwdfuhmsffkvlbbo/sql 에서 위 SQL 전문 붙여넣고 Run (재실행 안전). MCP 금지, 개인 대시보드로.
- (검증) `node scripts/check-supabase.mjs` → `✅ 연결 성공`.

> 기존 [`supabase/schema.sql`](../supabase/schema.sql)(profiles/ideas/purchases)은 **로그인·결제 정식화 시점**에 별도 적용. 지금은 votes-slug.sql만으로 충분.

## 2. 구글 로그인 (선택 — 안 하면 데모는 가짜 통과로 계속 동작)

발행(S3)에서 실제 구글 로그인을 켜려면:
1. Supabase 대시보드 → Authentication → Providers → **Google** 활성화.
2. Google Cloud Console에서 OAuth 클라이언트(웹) 생성 → Client ID/Secret을 Supabase Google provider에 입력.
3. 승인된 리디렉션 URI에 `https://fjhnwwdfuhmsffkvlbbo.supabase.co/auth/v1/callback` 추가.
4. Supabase Auth → URL Configuration에 배포 도메인(예: `https://오늘해볼까.vercel.app`) 추가.
5. **위 1~4를 마친 뒤에만** env에 `GOOGLE_LOGIN=1` 추가(로컬 `.env` + Vercel). 그래야 발행 화면이 실제 OAuth를 쓴다.
- ⚠ `GOOGLE_LOGIN=1`을 provider 설정 **전에** 켜면, 로그인 클릭이 Supabase 인증 URL로 리다이렉트되며 에러 페이지로 이탈한다(발행 불가). 그래서 기본값은 꺼짐 = 가짜 통과(발행 계속 동작). 투표/응원은 이 플래그와 무관하게 Supabase로 이미 동작.

## 3. Vercel 배포 (5분)

1. https://vercel.com/new → 이 GitHub 레포 Import (Framework: Next.js 자동 감지).
2. **Environment Variables**에 2개만 추가(값은 로컬 `.env`에 있는 것 그대로):
   - `SUPABASE_URL` = `https://fjhnwwdfuhmsffkvlbbo.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = (로컬 .env의 그 값 — publishable/anon 키, 공개 안전)
   - ※ `next.config.mjs`가 이 둘을 브라우저용 `NEXT_PUBLIC_*`로 브릿지하므로 이 이름 그대로 넣으면 됨.
3. Deploy.

### 로컬 실행
`.env`에 `SUPABASE_URL`·`SUPABASE_PUBLISHABLE_KEY`가 이미 있으므로 `npm run dev` 그대로. (없으면 localStorage 폴백으로 동작하되 응원은 발행자에게 안 감.)

---

## 동작 원리 (왜 이 최소 구성으로 충분한가)

- 카드/대결은 DB 행 없이 **URL slug에 인코딩**(무로그인 공유 = K의 심장). `card_votes`/`duel_votes`는 그 slug를 키로 응원만 집계.
- 수신자: 무로그인 익명 insert(RLS `anon insert`). 1인 1표 = `(slug, voter_fp)` unique + 브라우저 UUID 지문.
- 발행자: 자기 slug의 집계를 select(slug는 추측 불가 토큰). 대시보드가 `fetchVotes(slug)`로 **서버 표**를 읽는다.
- Supabase 미설정 시 `lib/votes.ts`가 전부 localStorage로 폴백 → 데모는 항상 동작(단 응원 도달은 서버 있을 때만).

## 남은 정식화 (이후)
- 실명 리빌(God Mode)·결제(PG)·spins 캡·이메일은 별도 스프린트(피벗 계획 P2+, 기존 schema.sql 확장).
