# 오늘 해볼까 — 사전 생성 아이디어 카드 확장 인계

최종 업데이트: 2026-07-14  
저장소: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu`

## 한 문장 목표

해외에서 작동이 확인된 제품 메커니즘을 한국의 구체적인 결제자·필요 순간·한 끗 변화와 미리 조합하고 검수해, 사용자가 기다리지 않고 즉시 고품질 아이디어 카드 네 장을 받게 한다.

## 오해하면 안 되는 것

- 이 작업은 카드 후보 중 하나를 골라 별도의 제품 PRD를 만드는 일이 아니다.
- 현재 제품 PRD는 이미 `오늘 해볼까` 자체를 정의한다.
- 네 후보를 모두 랜딩·선결제 실험하는 일이 아니다.
- 런타임 AI 생성기가 아니라 **사전 생성·사전 검수 데이터셋**이 핵심 자산이다.

## 새 세션에서 읽을 순서

1. [`TASK.md`](../../TASK.md) — 현재 목표와 다음 작업
2. [`docs/PRD.md`](../PRD.md) — 제품 한 장 요약
3. [`docs/prd/오늘-해볼까-prd.md`](../prd/오늘-해볼까-prd.md) — 상세 제품 기준
4. [`docs/dev/experiments/idea-lab/README.md`](../dev/experiments/idea-lab/README.md) — 아이디어 확장 자료 지도
5. [`docs/research/idea-source-coverage-summary.md`](../research/idea-source-coverage-summary.md) — 8,406개 원본 장부
6. [`docs/research/idea-final-decisions-62.jsonl`](../research/idea-final-decisions-62.jsonl) — 최근 후보 62개 결정 정본
7. [`src/components/organisms/idea-lab/sample-data.ts`](../../src/components/organisms/idea-lab/sample-data.ts) — 실제 앱 카드 데이터
8. [`src/components/organisms/idea-lab/idea-lab.tsx`](../../src/components/organisms/idea-lab/idea-lab.tsx) — 실제 조합·교체·결과 UI
9. [`tests/e2e/idea-lab.spec.ts`](../../tests/e2e/idea-lab.spec.ts) — 구현된 사용자 흐름

## 현재 상태

### 제품과 앱

- 상세 PRD는 네 장 뽑기 → 결과·제작 문구 → 공유 해제 → 익명 칭찬의 전체 루프를 정의한다.
- 앱은 로그인·취향 조사 없이 네 장 뽑기로 시작한다.
- 전체 다시 뽑기, 카드별 교체, 직접 입력, 결과 화면, 제작 문구 잠금·공유 해제, 칭찬 화면 연결이 구현돼 있다.
- 카드 데이터는 `sample-data.ts`에 로컬로 사전 탑재돼 있다. 런타임 LLM 생성은 없다.

### 정확한 데이터 수

- 실제 앱 원본 시나리오: **38개**
- 원본별 카드 풀: 결제자 3 × 순간 3 × 한 끗 3
- 원본별 런타임 조합: **27개**
- 현재 앱 런타임 조합: **1,026개**
- 1,000개 체크포인트: **38개 원본 / 1,026조합 달성**
- 장기 목표: **100개 원본 / 2,700조합**

`vector-similarity-1728.md`의 1,728은 한 끗뿐 아니라 두 끗 조합도 펼친 오프라인 감사 결과다. 현재 UI는 한 끗 카드 한 장을 선택하므로 실제 앱 수와 다르다.

### 리서치

- 통합 원본 8,406개
  - TrustMRR 1,863
  - App Store 4,512
  - Chrome Web Store 2,031
- 현재 앱 시나리오와 정확히 연결된 원본 **38개 / 38개**
- `voice-notes`는 `VoiceType.com` 수동 계보 연결 완료
- `screenshot-thirty-queue`는 UX 0/3·미연결이라 `site-photo-closeout` / Site Audit Pro로 교체 완료
- 최근 62개 후보 정본: Experiment Pass 4 / Merge 11 / Custom Reserve 5 / Fail 42
- 2단계 필터 실험 완료: 필터는 합격 판정이 아니라 사람이 먼저 읽는 순서에만 사용
- 네이버 검색 수요 30개 파일럿 완료: 현재 좋은 원본 오판율 30%로 자동 필터·정렬 불채택
- Google Trends 한국 공개 화면은 로그인된 브라우저에서 조회 가능함을 1개 표본으로 확인
- 8,406개 전체를 합치는 통합 판정 원장은 아직 만들지 않았으므로 이것이 다음 작업이다.

`Experiment Pass`는 과거 문서의 이름이다. 현재 제품 관점에서는 **앱 카드 그룹 후보**일 뿐이며 자동 승격하지 않는다.

## 다음 작업

완료된 재감사·필터·검색 실험은 다시 열지 않는다. 다음 순서만 따른다.

1. 앱 원본 38개, 최근 62개 판정, 2단계 직접 감사 결과를 원본 키 기준으로 통합한다.
2. 중복을 제거하고 8,406개 중 아직 판정하지 않은 실제 개수를 계산한다.
3. 필터 상위는 먼저 읽되 자동 합격·탈락시키지 않고, 100개씩 총 85개 배치로 전부 판정한다.
4. 각 원본에 입력·처리·즉시 결과·필요 순간·기본 기능 대비 우위를 한 문장씩 남긴다.
5. 각 배치에서 탈락의 10%를 재검사하고 오판율 5% 미만·누락 0·중복 0을 확인한다.
6. `후보`만 최대 10개씩 결제자 3 × 순간 3 × 한 끗 3과 27조합을 감사한다.
7. 감사 결과를 먼저 보여주고 통과한 수만 앱에 추가해 50개·75개·100개로 확장한다.

검색 수요는 `후보`의 한국어 표현이 불명확할 때만 보조 증거로 쓴다. 8,406개 전체 검색이나 Google Trends 30개 교차 확인은 필수 선행 작업이 아니다.

## 품질 원칙

- 현재 예시 수준의 구체성보다 낮으면 수량에 포함하지 않는다.
- 제목은 문제·결과가 바로 보이고, UVP는 뉴로마케팅 기준으로 통증과 유일 주장이 명확해야 한다.
- 해외 아이디어와 80~99% 동일해도 된다. 99% 이상도 제품 메커니즘 동일성 자체는 허용한다.
- 브랜드명, 로고, 고유 카피, 디자인 에셋 복제는 금지한다.
- 범위가 크면 `입력 1개 → 처리 1회 → 결과 1개`의 핵심 세로 조각으로 줄인다.
- 1인 빌더가 반나절~2일 안에 실제 작동 MVP를 만들 수 있어야 한다.
- OS·플랫폼 기본 기능이나 범용 AI 한 번이 더 낫다면 탈락이다.
- 문제 발생 전에 설치·기록해야만 가치가 생기는데 그 순간 유입할 수 없다면 탈락이다.
- 상대방·기관의 새 행동이 필수면 탈락이다.
- UX 합성 평가 2/3 미만은 실패다.
- 도메인 지식이 있어야만 가능한 것은 일반 카드에 넣지 않고 Custom Reserve로 보관한다.

## 파일 역할

| 위치 | 역할 |
|---|---|
| `TASK.md` | 지금 해야 할 일의 단일 정본 |
| `docs/PRD.md` | 제품 요약 |
| `docs/prd/오늘-해볼까-prd.md` | 상세 제품 명세 |
| `docs/dev/experiments/idea-lab/` | 생성·평가·감사 작업 자료 |
| `docs/research/` | 원본 데이터와 기계 판독 장부 |
| `src/components/organisms/idea-lab/sample-data.ts` | 실제 앱에 노출되는 사전 생성 데이터 |
| `docs/dev/archive/2026-07-13-idea-validation-detour/` | 잘못 갈라졌던 외부 실험 문서; 실행 대상 아님 |

## 검증 명령

```bash
cd /Users/yungyulee/Project/03_BFD/3rd-lee-yungyu
npm run typecheck
npx playwright test tests/e2e/idea-lab.spec.ts
node scripts/research/verify-idea-final-decisions.mjs
git diff --check
```

로컬 확인:

```bash
npm run dev
```

브라우저: `http://localhost:3000/`

## 작업 시 주의

- 워크트리에 기존 사용자 변경과 아직 추적되지 않은 리서치 파일이 많다. 리셋하거나 삭제하지 않는다.
- 과거 문서의 54조합은 당시 두 끗까지 포함한 정책일 수 있다. 현재 런타임 수와 섞지 않는다.
- `public/data/golden.json`과 `src/data/combos.json`은 이전 카드 품질/런타임 계열이다. Idea Lab의 `IdeaLabScenario` 38개와 같은 데이터셋으로 간주하지 않는다.
- 앱 데이터 수정 전 후보 보고서와 감사 결과를 먼저 남긴다.
