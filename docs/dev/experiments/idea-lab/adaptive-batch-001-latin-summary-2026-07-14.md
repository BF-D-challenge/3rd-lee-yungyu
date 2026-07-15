# Adaptive Batch 001 — Latin-9 감사 결과

- 검사 행: 90
- pass: 21
- review: 39
- fail: 30
- 범위: Candidate 10개 × 결제자·순간·한 끗 Latin-9 조합 9개
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| candidate-youtube-tag-extractor | 2 | 5 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-enhanced-github | 5 | 4 | 0 | 18 확장 감사 |
| candidate-base44-downloader | 3 | 4 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-clip-mojo | 2 | 3 | 4 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-print-notion | 0 | 7 | 2 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-blurred-out | 4 | 0 | 5 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-app-privacy-insights | 0 | 9 | 0 | 18 확장 감사 |
| candidate-zero-bounce | 1 | 4 | 4 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-aliexpress-price-tracker | 0 | 0 | 9 | 18/27 확장 감사 및 실패 원인 확인 |
| candidate-html2email | 4 | 3 | 2 | 18/27 확장 감사 및 실패 원인 확인 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
