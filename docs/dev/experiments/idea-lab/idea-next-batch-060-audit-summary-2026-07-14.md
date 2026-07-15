# 다음 Candidate 배치 60개 감사 결과

## 결론

- gate pass 후보 60개에 카드 3개씩 작성해 총 180개 스트레스 조합을 검사했다.
- 스트레스 결과는 pass 18, review 60, fail 102였다.
- 스트레스 3개를 모두 통과한 원본은 3개뿐이었다.
- 이 3개에 Latin-9 총 27개를 검사했지만 pass 0, review 16, fail 11이었다.
- Latin-9를 모두 통과한 원본이 0개이므로 전체 27조합 감사와 앱 승격을 진행하지 않는다.

## 스트레스 통과 후보

| 원본 | 스트레스 결과 | Latin-9 결과 | 다음 조치 |
|---|---:|---:|---|
| `app_store:1485387513` · Toca Boca Hair Salon 4 | 3/3 pass | 0/9 pass, 9 review | 카드 문구를 다시 쓴 뒤 재검토 |
| `app_store:657878530` · what3words: Navigation & Maps | 3/3 pass | 0/9 pass, 1 review, 8 fail | 승격하지 않음 |
| `app_store:1468880337` · Hexer — Hex File Viewer | 3/3 pass | 0/9 pass, 6 review, 3 fail | 승격하지 않음 |

## 앱 반영

- `sample-data.ts`는 수정하지 않았다.
- 현재 앱 원본 73개·런타임 조합 1,971개 상태를 유지한다.

검사 산출물:

- `docs/research/idea-next-batch-060-stress-summary-2026-07-14.md`
- `docs/research/idea-next-batch-060-latin-summary-2026-07-14.md`
- `docs/research/idea-next-batch-060-stress-results-2026-07-14.jsonl`
- `docs/research/idea-next-batch-060-latin-results-2026-07-14.jsonl`
