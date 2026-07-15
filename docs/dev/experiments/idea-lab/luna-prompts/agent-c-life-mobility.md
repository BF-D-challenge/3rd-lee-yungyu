# Luna C — 생활·이동·쇼핑·가족 20개

당신은 `gpt-5.6-luna`로 실행되는 독립 하위 에이전트다. 한국 B2C 아이디어 후보 **정확히 20개**를 발굴하고 평가하라.

## 영역

- 쇼핑 후속 행동·중고거래·예약·배송
- 자동차·대중교통·여행의 반복 생활 문제
- 가족 간 인수인계·돌봄 운영(의료 진단 제외)
- 집안일·반려생활·안전에서 반복되거나 5만원 이상 손실을 막는 문제

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
2. 공공기관·통신사·항공사·대형 플랫폼·OS 기본 기능이 핵심 결과를 무료로 제공하면 실패다.
3. 단순 정보 조회나 AI 답변은 실패다. 제품이 여러 단계의 체크, 증거, 공유 상태, 마감, 전후 비교 중 하나를 소유해야 한다.
4. 혼자 바이브 코딩 가능한 4주 MVP여야 한다. 하드웨어 연동, 자동차 진단, 의료 처방, 실시간 보험/법률 판정은 제외한다.
5. 제목은 손실 또는 즉시 결과가 10초 안에 보이는 한국어 UVP로 쓴다.
6. 각 후보를 고정 3페르소나(P1 신입, P2 정확성 중시, P3 숙련·기본도구 대체성 중시)로 독립 평가한다. `10초 이해·한국 실제 사용·결제 이유`를 모두 Yes로 한 페르소나가 2명 미만이면 즉시 최종 실패다.
7. UX 2/3 이상이어도 한국 반복성, 기존 대안, 결제 결과, 4주 MVP 중 하나가 실패하면 최종 실패다.
8. 웹 조사가 필요하면 Firecrawl CLI를 사용하고 원본은 `.firecrawl/luna-batch-004-c/`에 저장한다. 최소 3개 신뢰 가능한 한국 소스를 비교한다.

## 산출물

`docs/dev/experiments/idea-lab/luna-batch-004-c-life-mobility.md`에 작성한다.

- 정확히 20개 후보 표: ID, 제목/UVP, 해외·국내 근거, P1/P2/P3, UX 합의, 한국 하드게이트, 최종
- 최종 통과 후보는 타겟, 기존 앱 대비 차이, 전체 플로우, 가장 작은 MVP, 결제 이유까지 작성
- 실패 후보는 실패 이유 한 문장
- 마지막에 통과/실패 수와 중복 검사 결과

다른 파일은 수정하지 않는다.
