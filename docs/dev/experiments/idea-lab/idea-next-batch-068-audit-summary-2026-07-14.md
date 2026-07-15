# 다음 Candidate 배치 068 감사 결과

## 결론

- 카드 초안 60개를 만들고 스트레스 조합 180개를 검사했다.
- 스트레스 결과는 pass 57, review 25, fail 98이었다.
- 스트레스 3개를 모두 통과한 원본은 17개였고, 이 17개에 Latin-9 총 153개를 검사했다.
- Latin-9 결과는 pass 42, review 48, fail 63이었다.
- Latin-9를 9/9 통과한 원본은 `app_store:6784176363`, `app_store:1586151492` 2개였다.
- 두 원본의 전체 27조합(총 54개) 결과는 pass 13, review 17, fail 24였다.
  - `app_store:6784176363`: pass 0, review 12, fail 15
  - `app_store:1586151492`: pass 13, review 5, fail 9
- 따라서 전체 27조합을 통과한 원본은 **0개**이며, 앱 승격은 하지 않는다.

## 앱 반영

- `src/components/organisms/idea-lab/sample-data.ts`는 수정하지 않았다.
- 이 배치의 카드와 판정은 사전 감사 자료다. review/fail 카드의 사람 검수·재작성·재감사 전에는 앱 원본 수에 포함하지 않는다.

## 검사 산출물

- `docs/research/idea-next-batch-068-stress-results-2026-07-14.jsonl`
- `docs/research/idea-next-batch-068-latin-results-2026-07-14.jsonl`
- `docs/research/idea-next-batch-068-full-results-2026-07-14.jsonl`
- `docs/dev/experiments/idea-lab/idea-next-batch-068-stress-summary-2026-07-14.md`
- `docs/dev/experiments/idea-lab/idea-next-batch-068-latin-summary-2026-07-14.md`
- `docs/dev/experiments/idea-lab/idea-next-batch-068-full-summary-2026-07-14.md`
