# Adaptive Batch 001 — 적응형 감사 결과

- 검사 행: 30
- pass: 22
- review: 4
- fail: 4
- 입력 ID 순서로 복구한 판정 행: 0 (judge_id를 함께 보존)
- 범위: Batch 017 Stress-3
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| trustmrr:sessionwatcher | 3 | 0 | 0 | Latin-9 확대 감사 후보 |
| trustmrr:takeout-tools | 3 | 0 | 0 | Latin-9 확대 감사 후보 |
| trustmrr:sitemaptollm | 3 | 0 | 0 | Latin-9 확대 감사 후보 |
| trustmrr:octree | 2 | 1 | 0 | Latin-9 확대 감사 |
| trustmrr:beep-productivity-inc | 2 | 1 | 0 | Latin-9 확대 감사 |
| trustmrr:myterrace-net | 3 | 0 | 0 | Latin-9 확대 감사 후보 |
| trustmrr:payping-1 | 0 | 2 | 1 | 자동 승격 금지 · 실패 원인만 기록 |
| trustmrr:taillens-tool-for-frontend-developers | 3 | 0 | 0 | Latin-9 확대 감사 후보 |
| trustmrr:fonzo-io | 3 | 0 | 0 | Latin-9 확대 감사 후보 |
| trustmrr:resume-parse | 0 | 0 | 3 | 자동 승격 금지 · 실패 원인만 기록 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
