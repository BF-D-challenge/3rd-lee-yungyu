# 🌱 오늘 해볼까

> **무엇을 만들지 모르는 초보 1인 빌더가, 좋아하는 것(🌱씨앗)에서 출발해 오늘 만들 아이디어 1개를 뽑고, 지인 투표로 수요까지 확인하는 도구.**
> BF.D Vibe Coding Challenge 4주 프로젝트 (2026-07-06 ~ 08-02) · 이윤규

- 씨앗(내가 좋아하는 것·잘 아는 것)에서 출발한 **빈 슬롯 채우기**로 아이디어를 좁히고,
- 확정한 아이디어를 **9:16 카드**로 발행해 카톡/링크/스토리로 공유하면,
- 지인이 **로그인 없이 3초 응원**(🔥나도 이거 필요해/🙌완성하면 알려줘/👀지켜볼게/💪너라면 만들어)으로 수요 신호를 보내준다.

⚠️ 포지셔닝 금칙어: 이 제품을 "아이디어 생성기 · AI 추천 · 랜덤"이라고 말하지 않는다. ([PRD §1](docs/prd/오늘-해볼까-prd.md))

---

## 🚀 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # 타입 검사
npm run build      # 프로덕션 빌드
```

응원(투표) 데이터는 이미 Supabase에 연결돼 있다(계획보다 조기 연동 — `src/lib/backend/votes.ts`, `supabase/schema.sql`을 개인 계정 대시보드 SQL Editor에 직접 적용, 연결 확인은 `node scripts/check-supabase.mjs`). 로그인·결제는 아직 가짜 문.

## 📂 레포 지도

문서(`docs/`)와 코드(`src/`)를 최상위에서 분리했다. 코드는 다시 프론트(UI, `src/app`·`src/components`·`src/lib`)와 DB 연동 계층(`src/lib/backend/`) + DB 스키마(`supabase/`)로 나뉜다 — 단, 진짜 백엔드 서버는 없다. Next.js 앱이 브라우저에서 Supabase를 직접 호출하는 구조라 `src/lib/backend/`도 실제로는 브라우저에서 실행된다(RLS로 보호).

```
docs/                     # 문서 전부 (코드와 완전 분리)
  PRD.md                  #   한 장 요약 (작업 중 빠른 참조)
  TASK.md                 #   실행 계획 — 구현 현황·남은 백로그·DoD
  DEPLOY.md               #   배포 가이드
  prd/
    오늘-해볼까-prd.md      #   ★ 최종 PRD (기준 명세, v3 재통합 2026-07-08)
    오늘-해볼까-디자인-리셋.md #   moonlight 게임판 전환 목표 스펙 (확정, 구현 대기)
    archive/              #   v1 원본 · v3 개선안(R1~R26) · v4 다크리뉴얼 · 개별 개선안 5종 · 카드품질 실험계획
    assets/               #   UI 목업 4장 · 아이디어 엔진 실증(통과율 66.7%) · 인트로 설계 산출
  research/               #   원천 데이터 — 강의 대본·스토어 랭킹·trustmrr(카드 콘텐츠 근거 소스)·moonlight 원본
  dev/                    #   카드 아트 프롬프트 · 카드 콘텐츠 실험 확정본(experiments/card-quality) · simplicity 인트로 실측 · bfd-setup(세팅 도구 원본 보관)
src/                      # 코드 전부 (Next.js 공식 src/ 컨벤션)
  app/                    #   라우트 (L·S0·S1·S3·S5·S5-VS·S6) — 로직 없음
  components/             #   아토믹: atoms → molecules → organisms → layouts
  lib/                    #   pools(뽑기 엔진)·brief·josa·track·share·slot-store·storage
    backend/              #   ★DB 연동 계층 — Supabase 클라이언트·구글 OAuth·응원(votes) 데이터 접근
  data/combos.json        #   씨앗×불편×형태 조합 데이터 (allowlist·골든 조합·trustmrr 앵커)
public/                  # 정적 에셋 (Next.js 규칙상 루트 고정)
supabase/schema.sql       # 응원(투표) DB 스키마 — 이미 연동됨
scripts/                  # 개발 도구 (Supabase 연결 확인, 카드 품질 실험 스크립트)
.claude/                  # Claude Code 스킬(prd-maker·safe-push·민정코치)과 지식 베이스
_legacy/                  # 구 코드 백업 (git 미추적, 인터랙션 수치 참조용)
```

의존 방향은 아래로만: routes → organisms → molecules → atoms / 전 계층 → lib·data ([TASK.md §1](docs/TASK.md)).

## 📅 4주 계획 (요약 — 상세는 [PRD §6](docs/prd/오늘-해볼까-prd.md))

| 주차 | 목표 |
|------|------|
| 1주차 | end-to-end **가짜 루프** 완성 (전 여정 + 가짜 문 + 계측). Supabase 응원 백엔드는 계획보다 앞당겨 이미 연동됨 |
| 2주차 | 실유저 투하 → 병목 1개 확정 |
| 3주차 | 로그인 실전환(구글 원탭) + 수요 리포트 실물화 |
| 4주차 | BF.D 코호트 실전 투하 + 실측, 데모 영상 |

## 🌐 배포 (Vercel 자동 배포)

`main`에 push하면 `.github/workflows/deploy.yml`이 Vercel로 자동 배포한다. 작업 레포 GitHub **Settings → Secrets and variables → Actions**에 아래 3개가 등록돼 있어야 한다 (없으면 배포만 조용히 건너뜀):

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | [vercel.com/account/settings/tokens](https://vercel.com/account/settings/tokens)에서 발급 |
| `VERCEL_ORG_ID` | Vercel 계정 Settings → General → User ID |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트(Create Empty Project로 생성) Settings → General → Project ID (`prj_…`) |

환경 변수는 `.env.example` 참고 — **비밀 값은 절대 코드·커밋에 넣지 말 것** (`.env`는 gitignore됨). 초기 환경 세팅 전반은 [docs/bfd-setup/SETUP.md](docs/dev/bfd-setup/SETUP.md), 4주 운영 가이드는 [4주 챌린지 플레이북](docs/dev/bfd-setup/templates/4주-챌린지-플레이북.md).

## 💻 작업 흐름

1. 이 레포를 Claude Code로 열고 작업한다.
2. 올릴 때는 클로드에게 **"올려줘"** — safe-push 스킬이 비밀 파일·대용량 데이터를 점검한 뒤 push한다. (커밋만으로는 BF.D 트래킹 안 됨 — **PR을 올려야 집계**)
3. push되면 Vercel 자동 배포.
