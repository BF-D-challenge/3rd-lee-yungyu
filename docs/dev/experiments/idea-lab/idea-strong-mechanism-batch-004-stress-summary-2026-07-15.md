# Adaptive Batch 001 — 적응형 감사 결과

- 검사 행: 30
- pass: 18
- review: 5
- fail: 7
- 입력 ID 순서로 복구한 판정 행: 0 (judge_id를 함께 보존)
- 범위: 강한 메커니즘 배치 004 × Stress-3
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| trustmrr:framera | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:949490225 | 1 | 0 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| app_store:1505140281 | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:1043963852 | 1 | 1 | 1 | 18/27 확장 감사 및 실패 원인 확인 |
| app_store:525176875 | 1 | 0 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| app_store:1446555252 | 1 | 2 | 0 | 18 확장 감사 |
| trustmrr:validemail-co | 2 | 0 | 1 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:filexhost | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| trustmrr:myjson-online | 2 | 1 | 0 | 18 확장 감사 |
| trustmrr:mockphine | 1 | 1 | 1 | 18/27 확장 감사 및 실패 원인 확인 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
