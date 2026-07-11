# 🔥 오늘 해볼까

> **검증된 제품의 작동 방식을 네 장으로 뽑아 80~90%는 남기고 한 가지만 바꾼 아이디어를 만들고, 공유한 뒤 익명 응원을 받는 도구.**
> BF.D Vibe Coding Challenge 4주 프로젝트 · 이윤규

- **검증된 원본 / 돈 낼 사람 / 필요한 순간 / 한 끗 변화** 네 장을 먼저 뽑는다.
- 마음에 들지 않으면 전체 또는 한 장만 다시 뽑고, 직접 문장을 쓸 수도 있다.
- 결과를 공유하면 AI 코딩 도구에 붙여 넣을 전체 제작 문구가 열린다.
- 익명 응원이 오면 모닥불 주위의 유령과 점선 의자가 사람과 실제 의자로 채워지고 불꽃이 커진다.

기준 명세는 [최종 PRD v4](docs/prd/오늘-해볼까-prd.md), 현재 실행 순서는 [TASK](docs/TASK.md)다.

---

## 🚀 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # 타입 검사
npm run build      # 프로덕션 빌드
```

기존 Supabase 응원 저장 계층은 남아 있지만, v4의 익명 응원·이름 공개 동의·990원 가짜 문 데이터 구조는 TASK 순서에 따라 다시 맞춘다.

## 📂 레포 지도

문서(`docs/`)와 실행 코드(`src/`)를 분리한다. 최신 PRD는 한 개만 유지하고, 이전 기획은 날짜별 아카이브에서 보존한다.

```
docs/                     # 문서 전부 (코드와 완전 분리)
  README.md               #   문서 전체 지도
  PRD.md                  #   v4 한 장 요약
  TASK.md                 #   T0~T6 실행 순서
  DEPLOY.md               #   배포 가이드
  prd/
    오늘-해볼까-prd.md      #   ★ 유일한 최신 기준 명세
    archive/              #   과거 PRD와 실행 계획
    assets/               #   과거 목업·설계 근거
  research/               #   Gas·TrustMRR·App Store·Mobbin 등 리서치 코퍼스
  dev/                    #   정적 프로토타입·감사 페이지·실험과 체크포인트
src/                      # 코드 전부 (Next.js 공식 src/ 컨벤션)
  app/                    #   Next.js 라우트
  components/             #   아토믹: atoms → molecules → organisms → layouts
  lib/                    #   카드 선택·결과 조립·저장·공유 로직
  data/                   #   컴팩트한 입력 데이터
public/data/              # 원본 카드와 런타임 생성 데이터
supabase/                 # 익명 응원 저장 스키마
scripts/research/         # 감사·리서치 정적 페이지 생성
scripts/rollout/          # 카드 데이터 빌드·검증
```

자세한 폴더 역할은 [PROJECT_STRUCTURE](docs/PROJECT_STRUCTURE.md)를 참고한다.

## 📅 4주 계획

| 주차 | 목표 |
|------|------|
| 1주차 | 최종 PRD, Flow A/B 10화면 정적 HTML, 5명 이해 테스트 |
| 2주차 | 검증된 원본 기반 네 장 뽑기와 쉬운 결과·제작 문구 |
| 3주차 | 공유 링크, 익명 응원, 유령·의자 전환, 불꽃 성장 |
| 4주차 | 990원 가짜 문, 퍼널 계측, 실사용 결과와 데모 영상 |

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
