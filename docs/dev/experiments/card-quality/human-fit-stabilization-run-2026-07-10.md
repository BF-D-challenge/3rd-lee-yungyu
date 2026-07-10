# 카드 품질 안정화 런 로그

- 시작: 2026-07-10 04:17:36 KST
- 현재 안정판: 2026-07-10 07:16:42 KST
- 실제 경과: 약 180분
- 로컬 확인 URL: http://localhost:3000/

## 문제

브라우저에서 `축구 전술 리뷰`처럼 사용자가 보기에 납득하기 어려운 카드가 노출됐다. 직접 원인은 이전 생성 데이터와 런타임 allowlist가 느슨해, 검수에서 탈락했어야 할 seed-pain-format 조합도 계속 후보로 남아 있었기 때문이다. 재현 중에는 오래된 `golden.json`이 브라우저 세션에 남아 제거된 카드가 계속 보이는 캐시 문제도 확인했다.

## To-Be 기준

1. 말이 안 되는 카드는 고쳐서 살리기보다 우선 노출 후보에서 제외한다.
2. `needSource: inferred`, 축구/전술/스포츠 예측, 얼굴 합성, 주가 예측/자동매매 계열은 현재 롤아웃에서 제외한다.
3. 50억원 이상 대형 앵커는 오늘 반나절 MVP와 스케일 차이가 커서 제외한다.
4. `AppGrowKit`, generic 한국어 앵커, 기계식 UI 문구, 조사 오류, 거친 표현, 개발자 용어를 validator에서 막는다.
5. 런타임 allowlist는 `golden.json`에 실제 남은 검수 조합과 1:1로 맞춘다.
6. 브라우저는 `golden.json`을 캐시 우회로 다시 받게 한다.
7. 카드 앞면 라벨은 `short`와 `label`이 반복되지 않게 분리한다.

## 진행 결과

| 단계 | 후보 수 | 판단 |
| --- | ---: | --- |
| 최초 전량 생성 | 1000 | 추론 근거, 기계식 조합, 축구/전술 카드 포함 |
| 기본 QA 차단 | 408 | inferred/축구/조사 오류 제거 시작 |
| 계산기/템플릿 냄새 제거 | 131 | 기계식 카드 대량 제거 |
| 병렬 배치 병합 후 재감사 | 179 | 반복/의미 충돌/거대 앵커 남음 |
| 반복 seed-pain 축소 | 141 | 같은 고민의 변주 제거 |
| known semantic mismatch 제거 | 130 | 에이전트 QA의 high/medium 의미 충돌 제거 |
| 100억원 이상 앵커 제거 | 119 | Shopify/HubSpot/Intercom 등 과대 스케일 제거 |
| 50억원 이상 앵커 제거 | 113 | Apollo/Setapp/Splitwise/Fitbod 등 추가 제거 |
| 에이전트 의미 QA 반영 | 103 | 자동매매/라이브 노쇼/보안 불일치 제거 |
| 형식 쏠림 조정 | 100 | calc-tool 과밀과 반복 조합 축소 |
| 템플릿/데모 냄새 차단 | 98 | 후보 묶음 데모, 관리판 데모류 제거 |
| 위험 테마/약한 앵커 제거 | 89 | 얼굴 합성, 주가 예측, 자동매매, 약한 소셜 앵커 제거 |
| 형식 균형 최종 조정 | 87 | 노코드 계산형 약한 카드 2장 추가 제외 |
| 최종 블라인드 QA 반영 | 75 | 법률/부동산/발주/콜드메일/기만적 목업 리스크 제거 |
| 형식 균형 재조정 | 73 | 계산형 쏠림을 줄이기 위해 약한 계산형 2장 추가 제외 |

## 현재 안정판

- golden: 73장
- runtime allow seed: 51개
- runtime allow pair: 73개
- `needSource`: direct 34, adjacent 39, inferred 0
- 주요 format: vote-card 20, calc-tool 20, curation 10, template-gen 10, dashboard 6
- 최대 category share: 12.3%
- 최대 format share: 27.4%
- 금지 계열: 축구/전술/스포츠 예측, 얼굴 합성, 주가 예측, 자동매매, 법률/부동산 판단, 콜드메일 미도달 최적화는 golden/allow 모두 0건

## 코드 변경

- `public/data/golden.json`: 최종 노출 후보를 73장으로 축소하고 약한 문구를 순화.
- `src/data/combos.json`: allowlist를 golden 73쌍과 1:1로 재구성. 라벨 중복과 개발자/내부 용어를 정리.
- `src/lib/golden-store.ts`: `/data/golden.json` fetch에 `cache: "no-store"`와 cache-busting query 추가.
- `src/lib/pools.ts`: 런타임 seed pool을 `combos.allow` 기반으로 제한하고 최근 seed/combo 반복을 회피.
- `scripts/rollout/audit-golden-human-fit.mjs`: inferred, 축구, 위험 테마, generic 앵커, 거대 앵커, 의미 충돌, 표면 오류 차단.
- `scripts/rollout/validate-golden.mjs`: 화면 본문과 `frontStory`, `whyItMatters`까지 검수.
- `scripts/rollout/check-golden-visible-smells.mjs`: 결과 화면에 보이는 텍스트 기준 냄새 검사 추가.
- `scripts/rollout/audit-golden-variety.mjs`: category/format 쏠림 검사 추가.

## 검증

- `node scripts/rollout/validate-golden.mjs public/data/golden.json`: 통과, 73장
- `node scripts/rollout/check-golden-visible-smells.mjs public/data/golden.json`: 통과, bad 0
- `node scripts/rollout/audit-golden-human-fit.mjs --minScore 72 --label loop-final-73-strict`: 73/73 통과
- `node scripts/rollout/audit-golden-variety.mjs --label loop-final-73-strict`: 통과
- `node scripts/rollout/simulate-runtime-draws.mjs --runs 100000`: 실패 0건
- `npm run typecheck`: 통과
- `npm run build`: 통과
- `curl http://localhost:3000/`: 200
- `curl http://localhost:3000/data/golden.json?v=final73`: 73장, 금지 패턴 0건
- 30초 간격 서버 안정성 체크 10회: root 200, golden 73 유지
- 브라우저 5회 + 3회 + 최종 5회 샘플: 금지 패턴 0건, 라벨 중복 패턴 0건

## 남은 리스크

- 지금 상태는 1000장이 아니라 `노출해도 되는 안전판 73장`이다.
- 다음 확장은 같은 validator와 사람 QA를 통과한 카드만 추가해야 한다.
- 300장 이상으로 늘릴 때는 seed-pain-format별 최대 개수, evidence 스케일, 위험 테마 금지 기준을 유지해야 한다.
- 다음 작업은 신규 작성보다 사용자 블라인드 평가 20회로 “말이 된다/안 된다” 기준을 더 보정하는 것이 낫다.
