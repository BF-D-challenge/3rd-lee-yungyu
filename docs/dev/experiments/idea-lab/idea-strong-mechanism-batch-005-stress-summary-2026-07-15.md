# Adaptive Batch 001 — 적응형 감사 결과

- 검사 행: 30
- pass: 24
- review: 1
- fail: 5
- 입력 ID 순서로 복구한 판정 행: 0 (judge_id를 함께 보존)
- 범위: 강한 메커니즘 배치 005 × Stress-3
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| trustmrr:photo-string-art | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| trustmrr:smokify | 0 | 0 | 3 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:exif-data | 1 | 0 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:mermaidonline-live | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:1119117405 | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:6760979290 | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:288054534 | 2 | 1 | 0 | 18 확장 감사 |
| app_store:6449972752 | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:1526081216 | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:402405770 | 3 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
