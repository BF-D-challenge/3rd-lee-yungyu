# Strong Mechanism Batch 017 Full-27 선행 감사

- 날짜: 2026-07-15
- lane: TrustMRR Candidate 중 기존 앱 97개와 batch 001~014 미사용 원본
- 입력 원본: 10개
- 원칙: Stress-3 `3/3` → Latin-9 `9/9` → Full-27 `27/27`
- 수정: 원본별 단일 축 문구만 최대 1회, hard fail은 재검사하지 않음
- 이 문서는 앱 반영 전에 작성한 선행 감사다. `sample-data.ts`는 수정하지 않았다.

## 최종 Full-27 통과

| 원본                   | source key                                       |                Stress-3 | Latin-9 | Full-27 | 판정                   |
| ---------------------- | ------------------------------------------------ | ----------------------: | ------: | ------: | ---------------------- |
| SiteMapToLlm           | `trustmrr:sitemaptollm`                          |                     3/3 |     9/9 |   27/27 | 통과                   |
| myterrace.net          | `trustmrr:myterrace-net`                         |                     3/3 |     9/9 |   27/27 | 통과                   |
| Taillens               | `trustmrr:taillens-tool-for-frontend-developers` |                     3/3 |     9/9 |   27/27 | 통과                   |
| Fonzo.io               | `trustmrr:fonzo-io`                              |                     3/3 |     9/9 |   27/27 | 통과                   |
| Octree                 | `trustmrr:octree`                                | 2 pass · 1 review → 3/3 |     9/9 |   27/27 | 제목 1축 수정 후 통과  |
| Beep Productivity Inc. | `trustmrr:beep-productivity-inc`                 | 2 pass · 1 review → 3/3 |     9/9 |   27/27 | payer 1축 수정 후 통과 |

- 최종 통과 원본: **6개**
- 최종 통과 조합: **162/162 pass**
- review/fail: **0/0**

## 중단된 원본

| 원본           | 마지막 결과                                                                | 중단 이유                                                                  |
| -------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| SessionWatcher | Latin-9 `2 pass · 1 review · 6 fail`                                       | 프로젝트별·도구별·최근 세션 결과가 payer·moment와 교차할 때 여러 축이 깨짐 |
| Takeout Tools  | 최초 Full-27 `24 pass · 3 review`; 1회 수정 뒤 Latin-9 `8 pass · 1 review` | 수정 기회를 사용한 뒤에도 CSV 가져오기 결과와 순간의 연결이 명확하지 않음  |
| PayPing        | Stress-3 `0 pass · 2 review · 1 fail`                                      | 범용 AI 한 번이 더 쉬운 hard fail 포함                                     |
| Resume Parse   | Stress-3 `0 pass · 0 review · 3 fail`                                      | 세 조합 모두 범용 AI 대체 hard fail                                        |

## 수정 기록

1. Octree: 첫 twist 제목을 모든 컴파일 오류가 아니라 `특수문자 4종 이스케이프 수정`으로 좁혔다.
2. Beep: CSS selector를 모르는 마케터를 selector를 복사할 수 있는 웹 운영자로 바꿨다.
3. Takeout Tools: 세 번째 moment를 모든 payer가 직접 다시 쓰는 순간으로 바꿨지만 Latin-9에서 다른 1개 review가 남아 종료했다.

## 다음 게이트

위 6개만 원본 충실도와 현재 앱 97개 포트폴리오 중복 수동 판정으로 보낸다. 이 두 검사를 모두 통과해야 promotion candidate가 되며, promotion candidate 역시 앱 자동 승격을 뜻하지 않는다.

## 근거 파일

- 최초 Stress: `docs/research/idea-strong-mechanism-batch-017-stress-results-2026-07-15.jsonl`
- Stress 수정: `docs/research/idea-strong-mechanism-batch-017-stress-retry-results-2026-07-15.jsonl`
- 최초 Latin: `docs/research/idea-strong-mechanism-batch-017-latin-direct-results-2026-07-15.jsonl`
- 수정 후보 Latin: `docs/research/idea-strong-mechanism-batch-017-latin-retry-results-2026-07-15.jsonl`
- 최초 Full direct: `docs/research/idea-strong-mechanism-batch-017-full-direct-results-2026-07-15.jsonl`
- 최초 Full retry survivors: `docs/research/idea-strong-mechanism-batch-017-full-retry-results-2026-07-15.jsonl`
- Takeout 수정 Latin: `docs/research/idea-strong-mechanism-batch-017-takeout-retry-latin-results-2026-07-15.jsonl`
