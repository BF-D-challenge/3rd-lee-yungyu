# Luna B — 학습·창작·생산성 20개

당신은 `gpt-5.6-luna`로 실행되는 독립 하위 에이전트다. 한국 B2C 아이디어 후보 **정확히 20개**를 발굴하고 평가하라.

## 영역

- 시험·자격증·언어·직무 학습
- 1인 크리에이터·강사·발표자의 반복 제작
- 개인 생산성·파일·사진·스크린샷·캘린더 처리
- 한국 사용자가 실제로 반복하고 결제 결과를 설명할 수 있는 문제

## 먼저 읽을 파일

- `docs/dev/idea-quality-rubric.md`
- `src/components/organisms/idea-lab/sample-data.ts`
- `docs/dev/experiments/idea-lab/batch-001-internal-review.md`
- `docs/dev/experiments/idea-lab/batch-002-ascii-cards.md`
- `docs/dev/experiments/idea-lab/batch-002-ux-test-report.md`
- `docs/dev/experiments/idea-lab/batch-003-ascii-cards.md`
- `docs/dev/experiments/idea-lab/batch-003-ux-test-report.md`
- `docs/research/trustmrr-acquire/ideas.jsonl`

## 필수 규칙

1. 기존 32개 그룹과 배치 001~003 후보를 재사용하거나 이름만 바꾸지 않는다.
2. 단순 요약·생성·챗봇·문제 생성은 실패다. 제품이 복습 시점, 제작 검수, 진행 상태, 전후 비교, 파일 내보내기 중 하나를 소유해야 한다.
3. 이미 한국 상위 앱이나 OS 기본 기능이 핵심 결과를 해결하면 실패다.
4. 혼자 바이브 코딩 가능한 4주 MVP여야 한다. 대규모 콘텐츠 라이선스, 실시간 다자 협업, 고정밀 의료/채용 판정은 제외한다.
5. 제목은 10초 안에 입력과 결과가 보이는 한국어 UVP로 쓴다.
6. 각 후보를 고정 3페르소나(P1 신입, P2 정확성 중시, P3 숙련·기본도구 대체성 중시)로 독립 평가한다. `10초 이해·한국 실제 사용·결제 이유`를 모두 Yes로 한 페르소나가 2명 미만이면 즉시 최종 실패다.
7. UX 2/3 이상이어도 한국 반복성, 기존 대안, 결제 결과, 4주 MVP 중 하나가 실패하면 최종 실패다.
8. 웹 조사가 필요하면 Firecrawl CLI를 사용하고 원본은 `.firecrawl/luna-batch-004-b/`에 저장한다. 최소 3개 신뢰 가능한 한국 소스를 비교한다.

## 산출물

`docs/dev/experiments/idea-lab/luna-batch-004-b-learning-creator.md`에 작성한다.

- 정확히 20개 후보 표: ID, 제목/UVP, 해외·국내 근거, P1/P2/P3, UX 합의, 한국 하드게이트, 최종
- 최종 통과 후보는 타겟, 기존 앱 대비 차이, 전체 플로우, 가장 작은 MVP, 결제 이유까지 작성
- 실패 후보는 실패 이유 한 문장
- 마지막에 통과/실패 수와 중복 검사 결과

다른 파일은 수정하지 않는다.
