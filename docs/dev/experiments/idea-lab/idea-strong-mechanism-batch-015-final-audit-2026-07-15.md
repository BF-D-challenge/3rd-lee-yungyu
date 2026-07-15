# Idea Lab 강한 메커니즘 배치 015 최종 감사

## 결론

- 신규 미검토 App Store Candidate 선별: 10개
- 최초 Stress-3: 30행 · 14 pass · 1 review · 15 fail
- 원고 플래너 단일 축 1회 재검수: 3행 · 2 pass · 1 review
- Latin-9: 2개 · 18행 · 16 pass · 0 review · 2 fail
- Full-27: 1개 · 27행 · 22 pass · 3 review · 2 fail
- Full-27 27/27 통과: 0개
- 최종 승격 후보: **0개**
- 앱 상태: 97개 원본 · 2,619조합 유지
- `sample-data.ts`, `TASK.md`, 앱 포트폴리오·커버리지·원장: 수정하지 않음

## 원본별 결과

| 원본                    |          Stress-3 |         Latin-9 |        1회 재검수 |                     Full-27 | 결론                                                                    |
| ----------------------- | ----------------: | --------------: | ----------------: | --------------------------: | ----------------------------------------------------------------------- |
| Receipt Elite           |   0 pass · 3 fail |          미진행 |            미진행 |                      미진행 | 기본 문서 스캔·범용 AI로 더 쉽게 대체 가능                              |
| 原稿プランナー          | 2 pass · 1 review |          미진행 | 2 pass · 1 review |                      미진행 | 하루 부족 작업시간 결과를 한 번 명확히 했지만 3/3 미달                  |
| Bake Master             |               3/3 |             9/9 |            미진행 | 22 pass · 3 review · 2 fail | 주문 수량 변경·계량 순간에 퍼센트 표만 주는 조합이 부자연스러움         |
| GPX-Viewer              |               3/3 | 7 pass · 2 fail |            미진행 |                      미진행 | 고도 위험 확인 순간과 전체 요약·지도 결과가 교차하면 필요를 끝내지 못함 |
| DNS Client              |   0 pass · 3 fail |          미진행 |            미진행 |                      미진행 | 터미널 기본 DNS 조회로 대체 가능                                        |
| VSD Viewer              |   1 pass · 2 fail |          미진행 |            미진행 |                      미진행 | 도형 선택·레이어 확인이 추가 단계가 되고 moment와 어긋남                |
| Health Exporter         |   0 pass · 3 fail |          미진행 |            미진행 |                      미진행 | 문제 전에 Apple Health 기록이 쌓여 있어야 작동함                        |
| Microsoft Word PDF 변환 |   1 pass · 2 fail |          미진행 |            미진행 |                      미진행 | 표·이미지 보존 twist가 모든 payer·moment와 교차하지 못함                |
| StopTheMadness Pro      |   2 pass · 1 fail |          미진행 |            미진행 |                      미진행 | 정리 URL과 삭제 목록을 함께 줘 결과가 두 개가 됨                        |
| OpenMark                |   2 pass · 1 fail |          미진행 |            미진행 |                      미진행 | Mermaid 전용 결과가 판정상 일반 Markdown 렌더링을 벗어남                |

## 1회 재검수 원칙

이름만 바꿔 실패 원본을 다시 검사하지 않았다.

- `原稿プランナー`는 최초 Stress에서 `result_unclear` review만 있어, “부족한 작업시간 경고”를 “하루 필요 시간과 현재 계획 대비 부족한 분”으로 한 번만 구체화했다.
- 재검수도 2 pass · 1 review여서 두 번째 수정 없이 종료했다.
- OS·범용 AI 대체, 사전 기록 의존, 다중 결과, 추가 단계, 원본 이탈, payer·moment·twist 불일치처럼 `hard_gate: fail`이 나온 원본은 재검사하지 않았다.

## Full-27 최종 탈락 근거

### Bake Master

- 입력은 목표 총 반죽 중량과 재료 비율 한 덩어리다.
- 처리 자체는 baker's percentage 계산 한 번으로 작다.
- 재료별 그램표와 1g 단위 계량표 조합은 대부분 자연스러웠다.
- 그러나 “주문 수량이 바뀐 직후”와 “재료를 저울에 올리기 직전”에는 실제 그램값이 필요하다.
- 이 두 순간에 “밀가루 100% 기준 퍼센트 배합표”만 주는 조합 2개가 hard fail이어서 27/27 기준을 충족하지 못했다.
- Full 단계에서 확인된 hard fail이므로 문구를 다시 고치거나 재검사하지 않았다.

## 원본 충실도·97개 포트폴리오 중복 판정

- Full-27 27/27 통과 후보가 없으므로 원본 충실도 임베딩 대상은 0개다.
- 기존 97개 포트폴리오와 수동 중복 판정할 승격 후보도 0개다.
- 빈 후보를 억지로 임베딩하지 않았고, promotion-candidates JSON은 빈 배열로 기록했다.

## 승격 규칙 확인

- [x] 정확히 10개의 미검수 `app_store:` Candidate만 선별했다.
- [x] 현재 앱 source key와 배치 001~014 input/card-drafts source key를 제외했다.
- [x] Stress-3 3/3 → Latin-9 9/9 → Full-27 27/27 순서를 지켰다.
- [x] 단일 축 문구 문제만 원본별 한 번 재검수했다.
- [x] hard fail 원본은 재검사하지 않았다.
- [x] Full-27 결과 보고서를 promotion-candidates JSON보다 먼저 만들었다.
- [x] 27/27 통과 후보가 없어 promotion-candidates JSON을 빈 배열로 남겼다.
- [x] 앱 데이터는 수정하지 않았다.

## 근거 파일

- 선별: `docs/research/idea-strong-mechanism-batch-015-input-2026-07-15.jsonl`
- 카드 초안: `docs/research/idea-strong-mechanism-batch-015-card-drafts-raw-2026-07-15.jsonl`
- 최초 Stress-3: `docs/research/idea-strong-mechanism-batch-015-stress-results-2026-07-15.jsonl`
- 원고 플래너 1회 재검수: `docs/research/idea-strong-mechanism-batch-015-stress-retry-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-015-latin-results-2026-07-15.jsonl`
- Full-27 선행 보고서: `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-015-full-summary-2026-07-15.md`
- Full-27 결과: `docs/research/idea-strong-mechanism-batch-015-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-015-promotion-candidates-2026-07-15.json`
