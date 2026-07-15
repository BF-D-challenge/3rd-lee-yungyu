# 다음 Candidate 배치 067 감사 결과

## 결론

- 카드 초안 60개를 만들고 스트레스 조합 180개를 검사했다.
- 스트레스 결과는 pass 44, review 37, fail 99였다.
- 스트레스 3개를 모두 통과한 원본은 9개였고, 이 9개에 Latin-9 총 81개를 검사했다.
- Latin-9 결과는 pass 24, review 31, fail 26이었다.
- Latin-9를 9/9 통과한 원본은 `app_store:1582051883` 1개였다.
- 이 원본의 전체 27조합 결과는 pass 3, review 15, fail 9였다.
- 따라서 전체 27조합을 통과한 원본은 **0개**이며, 앱 승격은 하지 않는다.

## 앱 반영

- `src/components/organisms/idea-lab/sample-data.ts`는 수정하지 않았다.
- 이 배치의 카드·판정은 사전 감사 자료이며, review/fail 카드의 재작성·재감사 전에는 앱 원본 수에 포함하지 않는다.

## 검사 산출물

- `docs/research/idea-next-batch-067-stress-results-2026-07-14.jsonl`
- `docs/research/idea-next-batch-067-latin-results-2026-07-14.jsonl`
- `docs/research/idea-next-batch-067-full-results-2026-07-14.jsonl`
- `docs/dev/experiments/idea-lab/idea-next-batch-067-stress-summary-2026-07-14.md`
- `docs/dev/experiments/idea-lab/idea-next-batch-067-latin-summary-2026-07-14.md`
- `docs/dev/experiments/idea-lab/idea-next-batch-067-full-summary-2026-07-14.md`
