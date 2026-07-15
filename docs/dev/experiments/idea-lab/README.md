# Idea Lab 사전 생성 카드 작업 지도

이 폴더는 `오늘 해볼까`가 즉시 전달할 아이디어 카드 원천을 조사·생성·평가한 작업 기록이다.

## 현재 정본

- 전체 작업: [`../../../../TASK.md`](../../../../TASK.md)
- 새 세션 인계: [`../../../handoff/2026-07-13-idea-card-expansion.md`](../../../handoff/2026-07-13-idea-card-expansion.md)
- 공통 평가표: [`idea-evaluation-rubric-v2.md`](./idea-evaluation-rubric-v2.md)
- 최종 62개 판정: [`../../../research/idea-final-decisions-62.jsonl`](../../../research/idea-final-decisions-62.jsonl)
- 현재 사용자 대기열: [`idea-user-validation-queue-current.md`](./idea-user-validation-queue-current.md)
- ID 계보: [`idea-id-lineage.md`](./idea-id-lineage.md)
- 도메인형 별도 보관: [`idea-custom-expert-reserve.md`](./idea-custom-expert-reserve.md)
- 실제 앱 데이터: [`../../../../src/components/organisms/idea-lab/sample-data.ts`](../../../../src/components/organisms/idea-lab/sample-data.ts)
- 2단계 필터 최종 결과: [`task2-filter-experiment-final-2026-07-13.md`](./task2-filter-experiment-final-2026-07-13.md)
- 검색 수요 파일럿 결론: [`search-demand-pilot-analysis-2026-07-14.md`](./search-demand-pilot-analysis-2026-07-14.md)

## 원본 8,406개 전수 실험

- 독립 병렬 소실험 1차 결과: [`idea-source-parallel-pilot-2026-07-13.md`](./idea-source-parallel-pilot-2026-07-13.md)
- 전수 확인 실험 프로그램: [`idea-source-exhaustive-review-program-2026-07-13.md`](./idea-source-exhaustive-review-program-2026-07-13.md)
- 1차 선별 실험 결과: [`idea-source-screening-small-experiments-2026-07-13.md`](./idea-source-screening-small-experiments-2026-07-13.md)
- 전수 배치 요약: [`../../../research/idea-source-experiment-manifest-summary.md`](../../../research/idea-source-experiment-manifest-summary.md)
- 의미 심사 파일럿 60 요약: [`../../../research/idea-source-experiment-pilot-60-summary.md`](../../../research/idea-source-experiment-pilot-60-summary.md)

병렬 소실험은 서로 후보를 넘기지 않는 독립 선별 가설을 8,406개 전체에 같은 예산으로 적용해 효과를 비교한다. 전수 장부와 배치 매니페스트는 누락 방지 인프라이지, 소실험끼리 이어지는 직렬 파이프라인이 아니다.

`전수 확인`은 8,406개 모두가 메커니즘 정규화와 하드게이트를 거쳐 `shortlist / merge / reserve / reject` 중 하나의 이유 있는 판정을 받는 것을 뜻한다. 기계 점수만 생성한 현재 L1 상태를 검토 완료로 세지 않는다.

필터 실험과 검색 수요 실험은 2026-07-14에 종료했다. 필터는 먼저 읽는 순서에만 쓰고, 네이버·Google Trends는 자동 탈락이나 원본 간 절대 순위에 쓰지 않는다. 다음 작업은 새 실험 추가가 아니라 `TASK.md`의 100개 배치 전수 판정이다.

## 현재 수치

- 실제 앱: 원본 52개, 원본당 27조합, 합계 1,404조합
- 원본 장부 연결: 52/52
- 목표: 원본 100개, 2,700조합

## 역사 자료 읽는 법

- `luna-batch-*`, `batch-*`: 후보 발산과 당시 판정 기록이다. 최신 정본보다 우선하지 않는다.
- `idea-portfolio-reaudit-v2.md`, `idea-moment-access-*`, `idea-remaining-39-final-audit.md`: 게이트가 추가된 과정을 보존한다.
- `vector-similarity-1728.md`: 한 끗 3 + 두 끗 3을 모두 펼친 오프라인 임베딩 감사다. 현재 앱 런타임 조합 수가 아니다.
- `qa/vector-similarity-1620-summary.json`: 30개 원본 시점의 이전 감사 결과다.
- `archive/queues/`: 폐기된 중간 큐 계보다. 새 작업의 입력으로 사용하지 않는다.

새 후보는 과거 Pass 문구만 보고 앱에 넣지 않는다. 최신 공통 게이트로 다시 확인하고, 원본 1 + 결제자 3 + 순간 3 + 한 끗 3 전체가 통과할 때만 `sample-data.ts`로 승격한다.

## 임베딩 검사 환경

일회성 `/tmp` 환경 대신 사용자 홈의 영구 환경을 쓴다.

- Python 환경: `~/.local/share/idea-embedding-venv`
- 로컬 모델 캐시: `~/.cache/idea-embeddings`
- 전역 실행 명령: `~/.local/bin/idea-embeddings`
- 기본 모델: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- OpenAI 주 검사: `text-embedding-3-small`, `.env`의 `ALLSALE_OPEN_AI_KEY`

```bash
# 로컬 fastembed 교차검사
idea-embeddings \
  --input /tmp/idea-combinations.jsonl \
  --mode source-fidelity \
  --provider local

# OpenAI 주 검사
idea-embeddings \
  --input /tmp/idea-combinations.jsonl \
  --mode source-fidelity \
  --provider openai \
  --model text-embedding-3-small
```

`~/.local/bin`이 셸 `PATH`에 없을 때는 명령의 절대 경로를 사용한다.
