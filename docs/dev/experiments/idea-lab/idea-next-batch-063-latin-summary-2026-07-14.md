# Adaptive Batch 001 — 적응형 감사 결과

- 검사 행: 90
- pass: 18
- review: 42
- fail: 30
- 입력 ID 순서로 복구한 판정 행: 0 (judge_id를 함께 보존)
- 범위: Latin-9 for stress 3-pass originals
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| app_store:6751769519 | 0 | 9 | 0 | 18 확장 감사 |
| app_store:1458740001 | 0 | 9 | 0 | 18 확장 감사 |
| app_store:6760979290 | 9 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:339407922 | 0 | 9 | 0 | 18 확장 감사 |
| app_store:300590611 | 0 | 9 | 0 | 18 확장 감사 |
| app_store:588959204 | 0 | 0 | 9 | 18/27 확장 감사 및 실패 원인 확인 |
| app_store:6760676992 | 0 | 0 | 9 | 18/27 확장 감사 및 실패 원인 확인 |
| app_store:288054534 | 9 | 0 | 0 | 9개 통과 유지 + 10% shadow 27 감사 |
| app_store:336829635 | 0 | 6 | 3 | 18/27 확장 감사 및 실패 원인 확인 |
| chrome_web_store:khlafnpamapdkjifagknfnjjjdhdhhhi | 0 | 0 | 9 | 18/27 확장 감사 및 실패 원인 확인 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
