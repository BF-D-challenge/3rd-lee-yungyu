# 🌱 오늘 해볼까

> **무엇을 만들지 모르는 초보 1인 빌더가, 좋아하는 것(🌱씨앗)에서 출발해 오늘 만들 아이디어 1개를 뽑고, 지인 투표로 수요까지 확인하는 도구.**
> BF.D Vibe Coding Challenge 4주 프로젝트 (2026-07-06 ~ 08-02) · 이윤규

- 씨앗(내가 좋아하는 것·잘 아는 것)을 고정한 **3릴 슬롯**으로 아이디어를 좁히고,
- 확정한 아이디어를 **9:16 카드**로 발행해 카톡/링크/스토리로 공유하면,
- 지인이 **로그인 없이 3초 투표**(🔥써볼래/💬공감/🤔글쎄)로 수요 신호를 보내준다.

⚠️ 포지셔닝 금칙어: 이 제품을 "아이디어 생성기 · AI 추천 · 랜덤"이라고 말하지 않는다. ([PRD §1](prds/오늘-해볼까-prd.md))

---

## 🚀 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # 타입 검사
npm run build      # 프로덕션 빌드
```

1주차는 백엔드 없음 — 상태는 localStorage, 공유 URL이 데이터 캐리어. Supabase는 "공유가 실제로 일어난다" 실측 후 3주차에만 연동한다 (`supabase/schema.sql`을 개인 계정 대시보드 SQL Editor에 직접 적용, 연결 확인은 `node scripts/check-supabase.mjs`).

## 📂 레포 지도

```
PRD.md                  # 한 장 요약 (작업 중 빠른 참조)
TASK.md                 # 실행 계획 — 아키텍처·Phase·병렬 트랙·DoD
prds/
  오늘-해볼까-prd.md      # ★ 최종 PRD (BF.D 제출본)
  archive/              # v1 원본 · v3 개선안(리스크 R1~R26·화면/GA4 스펙) · v4 다크리뉴얼
  assets/               # UI 목업 4장 · 아이디어 엔진 실증(통과율 66.7%)
app/                    # Next.js 라우트 (L·S0·S1·S3·S5·S6) — 로직 없음
components/             # 아토믹: atoms → molecules → organisms → layouts
lib/                    # draw(뽑기 엔진)·josa·track·share·slot-store·storage
data/combos.json        # 씨앗×불편×형태 조합 데이터 (allowlist·골든 조합)
supabase/schema.sql     # 3주차용 스키마 (테이블 5 · RLS 15)
research/               # 원천 데이터 — 강의 대본·스토어 랭킹·trustmrr(덱 소스)·moonlight 원본
docs/                   # 카드 아트 프롬프트 · simplicity 인트로 실측 · bfd-setup(세팅 도구 원본 보관)
.claude/                # Claude Code 스킬(prd-maker·safe-push·민정코치)과 지식 베이스
_legacy/                # 구 코드 백업 (git 미추적, 인터랙션 수치 참조용)
```

의존 방향은 아래로만: routes → organisms → molecules → atoms / 전 계층 → lib·data ([TASK.md §1](TASK.md)).

## 📅 4주 계획 (요약 — 상세는 [PRD §6](prds/오늘-해볼까-prd.md))

| 주차 | 목표 |
|------|------|
| 1주차 | end-to-end **가짜 루프** 완성 (전 여정 + 가짜 문 3개 + 계측) |
| 2주차 | 실유저 투하 → 병목 1개 확정 |
| 3주차 | "공유가 일어난다" 증명 시에만 Supabase 실연동 |
| 4주차 | BF.D 코호트 실전 투하 + 실측, 데모 영상 |

## 🌐 배포 (Vercel 자동 배포)

`main`에 push하면 `.github/workflows/deploy.yml`이 Vercel로 자동 배포한다. 작업 레포 GitHub **Settings → Secrets and variables → Actions**에 아래 3개가 등록돼 있어야 한다 (없으면 배포만 조용히 건너뜀):

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | [vercel.com/account/settings/tokens](https://vercel.com/account/settings/tokens)에서 발급 |
| `VERCEL_ORG_ID` | Vercel 계정 Settings → General → User ID |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트(Create Empty Project로 생성) Settings → General → Project ID (`prj_…`) |

환경 변수는 `.env.example` 참고 — **비밀 값은 절대 코드·커밋에 넣지 말 것** (`.env`는 gitignore됨). 초기 환경 세팅 전반은 [docs/bfd-setup/SETUP.md](docs/bfd-setup/SETUP.md), 4주 운영 가이드는 [4주 챌린지 플레이북](docs/bfd-setup/templates/4주-챌린지-플레이북.md).

## 💻 작업 흐름

1. 이 레포를 Claude Code로 열고 작업한다.
2. 올릴 때는 클로드에게 **"올려줘"** — safe-push 스킬이 비밀 파일·대용량 데이터를 점검한 뒤 push한다. (커밋만으로는 BF.D 트래킹 안 됨 — **PR을 올려야 집계**)
3. push되면 Vercel 자동 배포.
