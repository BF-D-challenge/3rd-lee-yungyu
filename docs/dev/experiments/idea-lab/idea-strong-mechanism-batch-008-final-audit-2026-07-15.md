# 강한 메커니즘 배치 008 — 최종 감사

- 검사 원본: 10개
- 1회 재검수: 5개
- 평가기 오판 재확인: 2개
- 승격: 0개
- 앱 상태: 82개 원본 · 2,214조합 유지
- `sample-data.ts`: 수정하지 않음

## 결론

최초 Stress-3에서 4개가 3/3을 통과했지만 최초 Latin-9 완전 통과는 없었다. 문구 한 축만 문제인 5개를 한 번 재검수했고 HWP→PDF가 Latin-9 9/9에 도달했다. 그러나 Full-27에서 대학생 결제자와 문서 전달 순간의 연결이 약한 3개가 review가 되어 24 pass · 3 review로 종료했다. 품질 기준대로 27/27이 아닌 원본은 앱에 넣지 않는다.

## 1. 최초 Stress-3

| 원본 | pass | review | fail | 조치 |
|---|---:|---:|---:|---|
| NDNS 내돈내산 탐지기 | 2 | 0 | 1 | 한 끗 1개 재검수 |
| Shot Tracer | 3 | 0 | 0 | Latin-9 |
| HWP 뷰어 | 3 | 0 | 0 | Latin-9 |
| Mirage 편집 흔적 탐지 | 3 | 0 | 0 | Latin-9 |
| Image to STL | 3 | 0 | 0 | Latin-9 |
| CORSPROXY | 0 | 0 | 3 | 평가기 URL 규칙 확인 |
| Novel Translator | 1 | 2 | 0 | 제목 재검수 |
| Zero Bounce | 1 | 0 | 2 | 종료 |
| Scribbr Citation | 0 | 0 | 3 | 평가기 URL 규칙 확인 |
| Lakera Data Leak | 0 | 0 | 3 | 종료 — 범용 AI 대체·축 불일치 |

## 2. 최초 Latin-9

| 원본 | pass | review | fail | 결론 |
|---|---:|---:|---:|---|
| Shot Tracer | 5 | 2 | 2 | 순간 축 재검수 |
| HWP 뷰어 | 5 | 4 | 0 | 순간 축 재검수 |
| Mirage 편집 흔적 탐지 | 3 | 4 | 2 | 순간 축 재검수 |
| Image to STL | 2 | 0 | 7 | 종료 — 상품 유형별 payer·twist 구조 불일치 |

## 3. 1회 재검수

Retry Stress-3에서는 NDNS·HWP·Mirage·Novel Translator가 3/3, Shot Tracer가 1 pass · 2 review였다. Retry Latin-9 결과는 다음과 같다.

| 원본 | pass | review | fail | 결론 |
|---|---:|---:|---:|---|
| NDNS 내돈내산 탐지기 | 3 | 6 | 0 | 종료 |
| HWP 뷰어 | 9 | 0 | 0 | Full-27 |
| Mirage 편집 흔적 탐지 | 7 | 2 | 0 | 종료 |
| Novel Translator | 3 | 0 | 6 | 종료 |

HWP→PDF Full-27은 24 pass · 3 review · 0 fail이었다. 대학생이 받은 과제를 다른 사람에게 전달하는 moment가 세 twist에서 모두 약했다. 이미 moment 축을 한 번 수정했으므로 추가 문구 교체 없이 종료한다.

## 4. 평가기 URL 규칙 수정

기존 평가 문구는 URL 입력을 허용하면서도 일부 판정에서 입력된 URL의 페이지 내용이나 cURL 대상 응답을 `external_data_required`로 오인했다. 제공된 URL·공개 파일·cURL 대상 응답은 입력 처리이고, 입력에 없는 별도 계정·비공개 지표·시장 데이터만 외부 데이터로 보도록 규칙을 명시했다.

- Scribbr Citation: 수정 규칙 Stress-3 3/3 → Latin-9 4 pass · 2 review · 3 fail. 범용 AI 대체와 payer·moment 불일치로 종료.
- CORSPROXY: 수정 규칙 Stress-3 2 pass · 1 review. 결과 제목의 “오류 응답”이 실제 접근 가능한 응답과 혼동되어 종료.

평가기 오판은 바로잡았지만 품질 게이트를 낮추지는 않았다.

## 5. 앱 반영 결정

- Full-27 27/27 통과 원본: 0개
- 원본 충실도·포트폴리오 중복 검사 대상: 0개
- 앱 승격: 0개
- 다음 배치는 이번 실패 원본의 이름 변경이 아니라 아직 카드 감사에 들어가지 않은 새 Candidate로 구성한다.

## 산출물

- 선별: `docs/research/idea-strong-mechanism-batch-008-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-008-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-008-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-008-latin-results-2026-07-15.jsonl`
- 재검수 카드: `docs/research/idea-strong-mechanism-batch-008-retry-card-drafts-2026-07-15.jsonl`
- 재검수 Stress-3: `docs/research/idea-strong-mechanism-batch-008-retry-stress-results-2026-07-15.jsonl`
- 재검수 Latin-9: `docs/research/idea-strong-mechanism-batch-008-retry-latin-results-2026-07-15.jsonl`
- 재검수 Full-27: `docs/research/idea-strong-mechanism-batch-008-retry-full-results-2026-07-15.jsonl`
- 평가기 수정 재검수: `docs/research/idea-strong-mechanism-batch-008-evaluator-correction-stress-results-2026-07-15.jsonl`, `docs/research/idea-strong-mechanism-batch-008-evaluator-correction-latin-results-2026-07-15.jsonl`
