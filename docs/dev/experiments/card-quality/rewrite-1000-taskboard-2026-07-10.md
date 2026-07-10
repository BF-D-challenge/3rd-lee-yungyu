# 오늘 해볼까 카드 1,000개 전량 재작성 TASK

작성일: 2026-07-10  
목표 완료: 2026-07-10 05:00 KST  
운영 원칙: 1,000개 전량 재작성, 200~250개 2차 정밀 리뷰, 10분 단위 지휘/점검

## 완료 정의

- `public/data/golden.json`의 현재 1,000개 key를 유지한다.
- 1,000개 모두 기존 기계식 문장에서 벗어난 재작성본을 가진다.
- 각 카드에 `needSource`, `psychologyPrinciple`, `whyItMatters`, `differentiationAxis`를 붙인다.
- 4개 레인 산출물을 검증 후 병합한다.
- 고위험/고노출 200~250개는 2차 리뷰 상태를 남긴다.
- 05:00 KST 기준 pass/review/fail 결과와 다음 조치가 명확하다.

## 병렬 작업 레인

| 레인 | 담당 | 입력 | 출력 | 상태 |
|---|---|---|---|---|
| A | 작전/스키마/지휘 | 전체 계획, validator, TASK | taskboard, input split, 10분 점검 | 완료 |
| B | 1~250 재작성 | `scripts/rollout/manual-batches/rewrite-1000/inputs/lane-B-001-250.input.json` | `scripts/rollout/manual-batches/rewrite-1000/outputs/lane-B-001-250.json` | 완료 |
| C | 251~500 재작성 | `scripts/rollout/manual-batches/rewrite-1000/inputs/lane-C-251-500.input.json` | `scripts/rollout/manual-batches/rewrite-1000/outputs/lane-C-251-500.json` | 완료 |
| D | 501~750 재작성 | `scripts/rollout/manual-batches/rewrite-1000/inputs/lane-D-501-750.input.json` | `scripts/rollout/manual-batches/rewrite-1000/outputs/lane-D-501-750.json` | 완료 |
| E | 751~1,000 재작성 | `scripts/rollout/manual-batches/rewrite-1000/inputs/lane-E-751-1000.input.json` | `scripts/rollout/manual-batches/rewrite-1000/outputs/lane-E-751-1000.json` | 완료, 2차 QA 반영 |
| F | 검증/QA | B~E 출력, validator | validation report, review queue | 완료 |

## 10분 점검 로그

| 시각(KST) | 점검 내용 | 결정 |
|---|---|---|
| 02:15 | TASK 보드 생성, 1,000개 split 준비 | 하위 에이전트 실행 전 |
| 02:16 | B~E 하위 에이전트 병렬 실행 | 각 250장 output만 쓰도록 지시 |
| 02:26 | 1차 점검: E 기본 validator 통과. B/D/E output은 존재하지만 `needSource` enum, `differentiationAxis` object 실패. C output 미생성 | 네 레인 모두 스키마 수정 지시. 다음 점검에서 전량 validator 재확인 |
| 02:27 | 2차 점검: C/E는 전량 validator 기준 통과. B는 스키마 250건 실패. D는 스키마 250건과 oneliner 1건 실패 | B/D에만 재수정 지시. 병합은 대기 |
| 02:28 | 병합 점검: B/C/D/E 4개 output 모두 기본 validator와 전량 validator 통과 | `public/data/golden.json`에 1,000개 전량 병합, 백업 생성 |
| 02:29 | QA 점검: validator는 통과했지만 반복 문구와 원문 앵커 조각이 많음 | 전량 시스템 QA 패치 적용, `validate-golden`과 `typecheck` 통과 |
| 02:30 | 2차 정밀 리뷰: QA 상위 위험군이 Lane E에 집중됨 | Lane E 250장 2차 재작성 지시 |
| 02:31 | Lane E 2차 output 검증 | 기본 validator, 전량 validator, 반복 냄새 검사 통과 |
| 02:32 | Lane E 2차본을 `golden.json`에 upsert | 250장 업데이트, 전체 1,000장 validator/typecheck 통과 |
| 02:34 | 최종 빌드 검증 | `npm run build` 통과. `src/lib/draw.ts` lint 오류 1건은 `const` 변경으로 해결 |
| 02:47 | 잔여 문장 QA 처리 | `mechanism-vague`, `near-oneliner-limit`, `english-anchor-copy` 29건 수정 |
| 02:49 | digest-bot 문장 재점검 | 어색한 "새로 봐야 할 항목" 문장 21건 수동 폴리시 |
| 02:50 | 근거 보강 큐 생성 | `needSource: inferred` 318건을 evidence queue로 분리 |
| 02:51 | 최종 재검증 | `validate-golden`, QA 리포트, `typecheck`, `build` 통과 |

## 현재 검증 결과

- `node scripts/rollout/validate-golden.mjs public/data/golden.json`: 통과, total 1,000
- `node scripts/rollout/validate-rewrite-1000.mjs`: 통과, totalOutput 1,000
- `npm run typecheck`: 통과
- `npm run build`: 통과
- `node scripts/rollout/report-rewrite-1000-quality.mjs`: 2차 리뷰 후보 318개
- `docs/dev/experiments/card-quality/qa/rewrite-1000-evidence-queue.md`: 근거 보강 후보 318개

## 남은 QA 해석

자동 QA 후보는 318개이며 전부 `needSource: inferred` 때문에 잡힌다. `mechanism-vague`, `near-oneliner-limit`, `english-anchor-copy` 같은 문장 문제는 제거했다. 남은 일은 카피 재작성보다 근거 출처 보강이다. `external` 또는 `adjacent`로 올릴 수 있는 근거가 있는지 확인하고, 근거가 약한 카드는 `needs-evidence` 큐로 남긴다.

## 금지 문구

- `N개 뒤지다`
- `식은땀`
- `{seed} 하다가 {pain}에 막히는 사람`
- `스트릭`
- 범용 기록앱, 범용 체크리스트, 의미 없는 대시보드

## 카드 작성 체크

각 카드는 다음 질문을 통과해야 한다.

1. 사용자가 5초 안에 떠오르는가?
2. pain이 감정 묘사가 아니라 반복되는 행동 실패로 읽히는가?
3. format이 기능명이 아니라 사용 흐름으로 바뀌었는가?
4. evidence가 아이디어를 꾸미는 말이 아니라 니즈 근거로 작동하는가?
5. MVP 4개가 실제 UI 액션인가?
6. 같은 seed 안의 앞뒤 카드와 차별 축이 다른가?
