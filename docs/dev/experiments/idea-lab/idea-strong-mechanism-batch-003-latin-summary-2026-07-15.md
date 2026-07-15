# Adaptive Batch 001 — 적응형 감사 결과

- 검사 행: 36
- pass: 29
- review: 0
- fail: 7
- 입력 ID 순서로 복구한 판정 행: 0 (judge_id를 함께 보존)
- 범위: 강한 메커니즘 배치 003 × Latin-9
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| trustmrr:milestone-clip | 9 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| trustmrr:qranalytica | 4 | 0 | 5 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:gifduo | 7 | 0 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:vibe-app-scanner | 9 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
