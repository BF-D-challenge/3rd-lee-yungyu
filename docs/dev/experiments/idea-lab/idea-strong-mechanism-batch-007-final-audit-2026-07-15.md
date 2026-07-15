# 강한 메커니즘 배치 007 — 최종 감사

- 검사 원본: 10개
- 승격: 0개
- 앱 상태: 82개 원본 · 2,214조합 유지
- `sample-data.ts`: 수정하지 않음

## 결론

이번 배치는 낮은 단계에서 좋아 보이던 원본도 Full-27에서 축 교차 문제가 드러났다. HAR 진단은 첫 Latin-9을 통과했지만 Full-27이 15 pass · 6 review · 6 fail이었다. Figma 레이어 이름 정리는 한 번의 문구 재검수로 Latin-9을 통과했지만 Full-27이 21 pass · 3 review · 3 fail이었다. 따라서 둘 다 앱에 넣지 않는다.

## 1. 최초 Stress-3

| 원본 | pass | review | fail | 조치 |
|---|---:|---:|---:|---|
| Stream | 3 | 0 | 0 | Latin-9 |
| Haptic Testing | 3 | 0 | 0 | Latin-9 |
| Figma AI Rename | 3 | 0 | 0 | Latin-9 |
| PDF Dino | 3 | 0 | 0 | Latin-9 |
| VideoSubtitleOne | 2 | 1 | 0 | 1회 문구 재검수 |
| MEMOSYNE | 1 | 0 | 2 | 종료 |
| Exam Forge | 0 | 0 | 3 | 종료 — 범용 AI 대체 |
| Tag Assistant | 2 | 1 | 0 | 1회 문구 재검수 |
| PinStats | 0 | 1 | 2 | 종료 — 공개 URL로 비공개 지표 확보 불가 |
| AppGrowKit | 0 | 0 | 3 | 종료 — 외부 데이터·범용 AI 대체 |

## 2. 최초 Latin-9

| 원본 | pass | review | fail | 조치 |
|---|---:|---:|---:|---|
| Stream | 9 | 0 | 0 | Full-27 |
| Haptic Testing | 3 | 0 | 6 | 종료 — 촉감 재생과 코드가 두 결과 |
| Figma AI Rename | 8 | 1 | 0 | 순간 문구 1회 재검수 |
| PDF Dino | 5 | 2 | 2 | 종료 — payer·moment와 출력 형식 불일치 |

## 3. Stream Full-27

- 결과: 15 pass · 6 review · 6 fail
- 느린 요청 카드에 느림의 판정 기준이 없다.
- 요청·응답 본문 비교는 HAR 업로드 뒤 다시 요청을 선택해야 해 단일 처리 흐름을 벗어난다.
- 일부 조합은 다른 사람이 HAR를 전달해야만 시작되어 외부 행동이 필수다.
- 결론: 승격하지 않음. 여러 축을 다시 설계해야 하므로 이번 배치에서 이름만 바꿔 재검수하지 않는다.

## 4. 1회 재검수

| 원본 | Retry Stress-3 | Retry Latin-9 | Retry Full-27 | 결론 |
|---|---:|---:|---:|---|
| Figma AI Rename | 3/3 | 9/9 | 21 pass · 3 review · 3 fail | 승격하지 않음 |
| VideoSubtitleOne | 2 pass · 1 fail | — | — | 종료 |
| Tag Assistant | 2 pass · 1 review | — | — | 종료 |

Figma Full-27에서는 계층 경로명 카드가 시각 분석 기반 자동 이름 변경이라는 원본 메커니즘에서 벗어났고, 수정한 순간도 일부 조합에서 이미 정리를 끝낸 뒤 다시 정리하는 것으로 읽혔다. 재검수 기회는 한 번만 허용하므로 종료한다.

## 5. 앱 반영 결정

- Full-27 27/27 통과 원본: 0개
- 원본 충실도·포트폴리오 중복 검사 대상: 0개
- 앱 승격: 0개
- 다음 배치는 이번 탈락 원본의 이름 변경이 아니라, 아직 카드 감사에 들어가지 않은 새 Candidate 원본으로 구성한다.

## 산출물

- 선별: `docs/research/idea-strong-mechanism-batch-007-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-007-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-007-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-007-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-007-full-results-2026-07-15.jsonl`
- 재검수 카드: `docs/research/idea-strong-mechanism-batch-007-retry-card-drafts-2026-07-15.jsonl`
- 재검수 Stress-3: `docs/research/idea-strong-mechanism-batch-007-retry-stress-results-2026-07-15.jsonl`
- 재검수 Latin-9: `docs/research/idea-strong-mechanism-batch-007-retry-latin-results-2026-07-15.jsonl`
- 재검수 Full-27: `docs/research/idea-strong-mechanism-batch-007-retry-full-results-2026-07-15.jsonl`
