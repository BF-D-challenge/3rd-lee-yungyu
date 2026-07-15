# Review 후보 카드 재작성 최종 보고서

## 결론

- 061~069 배치의 Latin-9 결과에서 실패 0개·하드 실패 0개·비제목 구조 위험 0개인 원본 24개를 선별했다.
- 해외 제품명을 제목으로 검사하던 오류를 수정하고, 24개 모두 앱형 카드 구조로 다시 작성했다.
- 재작성 뒤 스트레스 72행은 pass 28·review 18·fail 26이었다.
- 스트레스 3/3을 통과한 원본 4개의 Latin-9 36행은 pass 22·review 4·fail 10이었다.
- Latin-9를 9/9 통과한 원본은 0개라 전체 27조합 감사 대상도 0개다.
- 7 pass·2 review·0 fail이었던 2개 원본을 두 차례 더 수정했지만 스트레스 3/3을 만들지 못했다.
- 최종 전체 27조합 통과 원본과 앱 승격 원본은 0개다. `sample-data.ts`는 수정하지 않았다.

## 파이프라인에서 바로잡은 문제

1. 검수 제목을 해외 원본명에서 한국어 `resultTitle`로 변경했다.
2. 카드 초안을 단순 문자열에서 앱에 가까운 구조로 변경했다.
   - payer: `value`, `detail`
   - moment: `value`, `detail`
   - twist: `value`, `detail`, `resultTitle`, `smallestBuild`
3. `smallestBuild`가 입력 1개 → 처리 1회 → 결과 1개를 직접 설명하게 했다.
4. 검수 입력에서 `source_name`과 `result_title`을 분리했다.
5. 제각각이던 위험 코드를 19개 고정 코드로 제한했다.

## 24개 재작성 감사

| 단계 | 원본 | 검사 행 | pass | review | fail | 다음 단계 |
|---|---:|---:|---:|---:|---:|---|
| 스트레스 3 | 24 | 72 | 28 | 18 | 26 | 3/3 원본 4개 |
| Latin-9 | 4 | 36 | 22 | 4 | 10 | 9/9 원본 0개 |
| 전체 27 | 0 | 0 | 0 | 0 | 0 | 앱 승격 0개 |

Latin-9까지 간 원본:

| 원본 | pass | review | fail | 결론 |
|---|---:|---:|---:|---|
| Stardew Save Editor | 5 | 0 | 4 | 탈락 |
| Peekaboo Barn | 3 | 0 | 6 | 탈락 |
| Glass & Island | 7 | 2 | 0 | 재작성 후에도 스트레스 3/3 실패 |
| CreatorGrade Pro | 7 | 2 | 0 | 재작성 후에도 스트레스 3/3 실패 |

## 마지막 두 후보의 재작성 결과

첫 재작성은 payer·moment 맥락은 맞췄지만 twist가 제품·여행·팬덤처럼 갈라져 교차조합이 깨졌다. 세 축을 하나의 공통 문제로 다시 묶은 마지막 재작성에서도 다음 문제가 남았다.

- Glass & Island: 사진 배경은 통과했지만 글자·도형 추가가 원본 메커니즘을 벗어났다.
- CreatorGrade Pro: 단일 클립 색보정은 통과했지만 여러 영상의 색감 통일은 입력 1개로 확인하기 어려웠다.

이 두 원본은 이름만 바꿔 다시 시도하지 않는다. 새로운 카드 구조나 더 강한 원본 근거가 생기기 전까지 재검토 큐에 넣지 않는다.

## 산출물

- 실패 원인 분석: `idea-next-batches-061-069-failure-analysis-2026-07-15.md`
- 재작성 후보: `docs/research/idea-review-rewrite-shortlist-2026-07-15.jsonl`
- 새 카드: `docs/research/idea-review-rewrite-card-drafts-2026-07-15.jsonl`
- 스트레스 결과: `docs/research/idea-review-rewrite-stress-results-2026-07-15.jsonl`
- Latin-9 결과: `docs/research/idea-review-rewrite-latin-results-2026-07-15.jsonl`
- 최종 재시도 결과: `docs/research/idea-review-rewrite-final-retry-stress-results-2026-07-15.jsonl`

## 다음 원칙

- 제목 오류 때문에 탈락한 과거 결과를 그대로 원본 실패로 세지 않는다.
- 새 후보는 처음부터 앱형 카드 구조로 작성한다.
- 세 축을 각각 다양하게 만드는 것보다 27개 교차조합이 같은 문제 안에 머무는 것을 우선한다.
- 스트레스 3/3과 Latin-9 9/9를 통과하지 못하면 전체 27조합과 앱 승격을 진행하지 않는다.
