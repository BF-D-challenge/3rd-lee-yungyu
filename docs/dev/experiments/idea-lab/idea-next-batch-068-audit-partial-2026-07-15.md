# 다음 Candidate 배치 068 감사 — 재개 대기 Partial

> 완료 기록: 남은 7행을 2026-07-15에 복구해 Latin-9와 Full-27까지 마쳤다. 최종 결과는 `docs/dev/experiments/idea-lab/idea-next-batch-068-audit-summary-2026-07-14.md`를 본다.

상태: **미완료 — 앱 반영 금지**  
기록일: 2026-07-15

## 완료된 단계

- 원본 60개 카드 초안: 60/60 생성·병합 완료
- 스트레스 조합: 180/180 판정 완료 — pass 57, review 25, fail 98
- 스트레스 3/3 pass 원본: 17개
- Latin-9 입력: 153행 생성 완료
- Latin-9 판정 partial: **146/153행 완료**, 나머지 7행은 Codex CLI `ETIMEDOUT`으로 미판정
- active Latin judge: **없음**

## 보존된 Latin partial

아래 파일은 모두 정상 JSON 결과이며 다시 실행하지 않는다. 행 수 합계는 146이다.

| 파일 | 행 수 | 원래 Latin 범위 |
|---|---:|---|
| `docs/research/idea-next-batch-068-latin-part-0-2026-07-14.json` | 25 | 0–24 |
| `docs/research/idea-next-batch-068-latin-part-1a1-2026-07-14.json` | 6 | 25–30 |
| `docs/research/idea-next-batch-068-latin-part-1a2-2026-07-14.json` | 7 | 31–37 |
| `docs/research/idea-next-batch-068-latin-part-1b1-2026-07-14.json` | 6 | 38–43 |
| `docs/research/idea-next-batch-068-latin-part-2-2026-07-14.json` | 25 | 51–75 |
| `docs/research/idea-next-batch-068-latin-part-3-2026-07-14.json` | 26 | 76–101 |
| `docs/research/idea-next-batch-068-latin-part-4-2026-07-14.json` | 25 | 102–126 |
| `docs/research/idea-next-batch-068-latin-part-5-2026-07-14.json` | 26 | 127–152 |

## 미판정 범위와 재개 방법

- 남은 원래 Latin 입력 인덱스: **44–50** (7행)
- 재개 입력: `docs/research/idea-next-batch-068-latin-input-2026-07-14.jsonl`
- 기존 6-part의 part 1은 25–50 범위였고, 이미 25–43은 위 partial로 끝났다.
- 남은 44–50만 작은 순차 part로 `scripts/research/run-idea-card-rerun-codex.mjs`를 실행한다. active runner가 없는 것을 먼저 확인한 뒤에만 시작한다.
- 7행까지 끝나면 위 8개 partial과 새 7개 결과를 입력 순서대로 `merge-adaptive-audit-results.mjs --positional true`로 합쳐 Latin summary를 만든다.
- 그때 Latin-9를 9/9 통과한 원본만 `scripts/research/generate-idea-next-full-audit.mjs`로 전체 27행을 만들고 다시 Codex judge한다.

## 앱 경계

- `src/components/organisms/idea-lab/sample-data.ts`는 수정하지 않았다.
- Latin-9와 전체 27조합이 완료되기 전에는 어떤 원본도 승격·집계하지 않는다.

## 관련 산출물

- `docs/research/idea-next-batch-068-card-drafts-2026-07-14.jsonl`
- `docs/research/idea-next-batch-068-stress-results-2026-07-14.jsonl`
- `docs/research/idea-next-batch-068-latin-input-2026-07-14.jsonl`
- `docs/dev/experiments/idea-lab/idea-next-batch-068-stress-summary-2026-07-14.md`
