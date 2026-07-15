# Adaptive Batch 001 — 적응형 감사 결과

- 검사 행: 198
- pass: 12
- review: 53
- fail: 133
- 입력 ID 순서로 복구한 판정 행: 8 (judge_id를 함께 보존)
- 범위: 11 review candidates × 18 re-audit combinations
- 앱 반영: 아직 하지 않음

## 원본별 결과

| 원본 | pass | review | fail | 다음 조치 |
|---|---:|---:|---:|---|
| trustmrr:ai-suitup | 0 | 0 | 18 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:kitchen-design-ai | 0 | 0 | 18 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:myterrace-net | 2 | 3 | 13 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:picmal | 0 | 0 | 18 | 18/27 확장 감사 및 실패 원인 확인 |
| chrome_web_store:baakfnbonkakgheghpeadmkmkegeocjo | 10 | 0 | 8 | 18/27 확장 감사 및 실패 원인 확인 |
| chrome_web_store:iahnhfdhidomcpggpaimmmahffihkfnj | 0 | 0 | 18 | 18/27 확장 감사 및 실패 원인 확인 |
| trustmrr:dome-flashcards | 0 | 18 | 0 | 18 확장 감사 |
| chrome_web_store:fekfpgdgajbfdjkfimainjjhfcfoonlj | 0 | 0 | 18 | 18/27 확장 감사 및 실패 원인 확인 |
| chrome_web_store:jnloekndgehbebkkaehndhihcpoliaal | 0 | 14 | 4 | 18/27 확장 감사 및 실패 원인 확인 |
| chrome_web_store:kdlfddjhmdfcdepdagbjlcodpolmmkki | 0 | 0 | 18 | 18/27 확장 감사 및 실패 원인 확인 |
| app_store:373493387 | 0 | 18 | 0 | 18 확장 감사 |

## 판정 원칙

- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.
- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.
- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.
