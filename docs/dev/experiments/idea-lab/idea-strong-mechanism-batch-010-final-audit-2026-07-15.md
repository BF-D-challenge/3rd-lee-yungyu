# 강한 메커니즘 배치 010 — 최종 감사

- 대상: 이전 카드 초안과 앱 포트폴리오에 없던 `chrome_web_store:` Candidate 10개
- 최초 Stress-3: 30행 · 25 pass · 0 review · 5 fail
- 최초 Latin-9: 6개 · 54행 · 33 pass · 8 review · 13 fail
- 최초 Full-27: 1개 · 27행 · 24 pass · 3 review · 0 fail
- 1회 단일 축 재검수: 6개
- 최종 Full-27 완전 통과: 3개 · 81/81 pass
- 승격 후보 JSON: 3개
- 앱 반영: 하지 않음

## 결론

10개를 Stress-3으로 시작해 완전 통과한 6개만 Latin-9로 확대했다. 최초 Latin-9에서는 Seerguard만 9/9였지만 Full-27에서 역할별로 작성된 순간 문구 하나가 다른 payer와 교차할 때 3 review가 생겼다.

기능이나 범위를 바꾸지 않고 단일 축 문구만 고칠 수 있는 6개를 각각 한 번 재검수했다. `Print Notion`, `Seerguard`, `Google Maps Extended Routes`가 재검수 Stress-3 3/3, Latin-9 9/9, Full-27 27/27을 모두 통과했다. 나머지는 재검수 기회를 썼으므로 더 고치지 않았다.

## 1. 최초 Stress-3

| 원본                        | pass | review | fail | 조치                                             |
| --------------------------- | ---: | -----: | ---: | ------------------------------------------------ |
| rep+                        |    2 |      0 |    1 | payer·moment·twist 교차 불일치로 종료            |
| UPResize                    |    2 |      0 |    1 | payer·moment·twist 교차 불일치로 종료            |
| mockforme                   |    3 |      0 |    0 | Latin-9                                          |
| Broken Link Checker         |    3 |      0 |    0 | Latin-9                                          |
| Google Maps Extended Routes |    3 |      0 |    0 | Latin-9                                          |
| Seerguard                   |    3 |      0 |    0 | Latin-9                                          |
| Autopilot Aeroplan          |    1 |      0 |    2 | 외부 데이터·한국 맥락 문제로 종료                |
| leetStats                   |    3 |      0 |    0 | Latin-9                                          |
| Print Notion                |    3 |      0 |    0 | Latin-9                                          |
| IPvFoo                      |    2 |      0 |    1 | 원본 서버 IP 보장 문구를 현재 연결 IP로 1회 수정 |

## 2. 최초 Latin-9와 Full-27

| 원본                        | Latin pass | Latin review | Latin fail | 다음 조치                              |
| --------------------------- | ---------: | -----------: | ---------: | -------------------------------------- |
| mockforme                   |          4 |            2 |          3 | moment 축 1회 수정                     |
| Broken Link Checker         |          7 |            2 |          0 | payer·moment·twist 두 축 이상이라 종료 |
| Google Maps Extended Routes |          5 |            4 |          0 | moment 축 1회 수정                     |
| Seerguard                   |          9 |            0 |          0 | Full-27                                |
| leetStats                   |          4 |            0 |          5 | moment 축 1회 수정                     |
| Print Notion                |          4 |            0 |          5 | moment 축 1회 수정                     |

Seerguard의 최초 Full-27은 24 pass · 3 review였다. 세 review가 모두 `사내 IT 관리자 × 고객사 보고 직전`이라는 같은 moment 축 문제였으므로 moment만 한 번 수정했다.

## 3. 단일 축 1회 재검수

재검수 대상과 수정 축은 다음과 같다.

| 원본                        | 수정 축 |    Retry Stress-3 | 다음 조치 |
| --------------------------- | ------- | ----------------: | --------- |
| mockforme                   | moments | 1 pass · 2 review | 종료      |
| leetStats                   | moments | 2 pass · 1 review | 종료      |
| IPvFoo                      | twists  | 2 pass · 1 review | 종료      |
| Print Notion                | moments |          3/3 pass | Latin-9   |
| Seerguard                   | moments |          3/3 pass | Latin-9   |
| Google Maps Extended Routes | moments |          3/3 pass | Latin-9   |

Retry Latin-9는 세 원본 모두 9/9, 합계 27/27 pass였다. Retry Full-27도 세 원본 모두 27/27, 합계 81/81 pass였다.

## 4. 승격 후보 3개

| 시나리오 ID                     | 해외 원본                   | 입력 → 처리 → 결과                                                |
| ------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `notion-page-to-pdf`            | Print Notion                | 공개 Notion URL → 레이아웃 보존 렌더링 → PDF 파일                 |
| `chrome-extension-static-audit` | Seerguard                   | CRX 파일 → 권한·도메인·스크립트 정적 검사 → HTML 위험 근거 보고서 |
| `maps-route-to-gpx`             | Google Maps Extended Routes | 공개 Google Maps 경로 URL → 경로 구조 변환 → GPX 파일             |

## 5. 임베딩 감사

### 원본 충실도

- 입력: 81개 단일 한 끗 런타임 조합
- pass: 81/81
- 최소 기준 미달: 0개
- 중앙값 유사도: 0.983152
- 최고 유사도: 0.990048
- 0.99 초과 27개는 원본 메커니즘의 정확한 보존이 허용되는 정책에 따라 pass다.

### 앱 포트폴리오 중복

- 비교 범위: 기존 앱 82개 + 후보 3개 = 85개 원본 · 2,295조합
- cross-scenario review 기준: 0.765504
- cross-scenario critical 기준: 0.817516
- 후보 focus 쌍: 181,521개
- 후보 focus review: 98개
- 후보 focus critical: 3개
- 최대 유사도: 0.829227 (`large-file-share-link` ↔ `notion-page-to-pdf`)

98 review와 3 critical은 모두 `notion-page-to-pdf`에서 발생했다. `chrome-extension-static-audit`와 `maps-route-to-gpx`는 review·critical 쌍이 없다. Notion 후보의 최대 이웃은 “대용량 파일 업로드 → 임시 공유 링크”이고 새 후보는 “공개 Notion URL → 레이아웃 보존 렌더링 → PDF 파일”이다. 전달 순간 문구는 비슷하지만 입력·처리·결과가 모두 달라 별개 메커니즘으로 수동 통과한다.

## 6. 앱 반영 결정

- Full-27 27/27 통과: 3개
- 원본 충실도: 81/81 pass
- 포트폴리오: 2개 자동 통과, 1개 수동 메커니즘 구분 통과
- promotion candidate JSON: 생성 완료
- 이 보고서를 사용자에게 먼저 공개한 뒤 `sample-data.ts`, `TASK.md`, 앱 포트폴리오, coverage, ledger에 통과 원본 3개를 반영함

반영 원본은 `notion-page-to-pdf`, `chrome-extension-static-audit`, `maps-route-to-gpx`이며 이 배치가 추가한 런타임 조합은 81개다.

## 산출물

- 선별: `docs/research/idea-strong-mechanism-batch-010-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-010-card-drafts-2026-07-15.jsonl`
- 최초 Stress-3: `docs/research/idea-strong-mechanism-batch-010-stress-results-2026-07-15.jsonl`
- 최초 Latin-9: `docs/research/idea-strong-mechanism-batch-010-latin-results-2026-07-15.jsonl`
- 최초 Full-27: `docs/research/idea-strong-mechanism-batch-010-full-results-2026-07-15.jsonl`
- 재검수 카드: `docs/research/idea-strong-mechanism-batch-010-retry-card-drafts-2026-07-15.jsonl`
- 재검수 Stress-3: `docs/research/idea-strong-mechanism-batch-010-retry-stress-results-2026-07-15.jsonl`
- 재검수 Latin-9: `docs/research/idea-strong-mechanism-batch-010-retry-latin-results-2026-07-15.jsonl`
- 재검수 Full-27: `docs/research/idea-strong-mechanism-batch-010-retry-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-010-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-010-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-010-portfolio-similarity-2026-07-15.json`
