# 해외 제품·OSS 구현 패턴

## 1. Productboard Spark

[공식 페이지](https://www.productboard.com/product/spark/)가 설명하는 입력은 고객 피드백, 시장 신호, 경쟁 정보, 전략과 제품 맥락이다. 출력은 새 기회, 피드백 분석과 delivery-ready specification이다.

주목할 패턴:

- 새 기회를 주기적으로 자동 갱신
- 고객 피드백을 세그먼트 크기와 연결
- 발견 → 스펙 → 출시 후 평가를 한 루프로 연결
- 각 발견에 인용을 붙이는 방향

한계:

- 제품사 설명으로 실제 정확도·편향·조직 성과는 독립 검증되지 않았다.

## 2. Bagel Discovery OS

[공식 페이지](https://bagel.ai/platform-overview/bagel-discovery-os/)는 Gong, Salesforce, Zendesk, Jira, Slack, 리뷰와 제품 분석 등 100개 이상의 소스를 연결한다고 설명한다. 고객 인용뿐 아니라 매출 맥락을 기회 판단에 붙이고, 출시 결과를 원래 베팅에 연결하는 것이 특징이다.

주목할 패턴:

- 연구 프로젝트가 아니라 always-on discovery
- 가설이 들어오면 지지·반박·인접한 더 강한 기회를 반환
- VOC 빈도와 CRM·매출 영향을 결합
- MCP로 Claude·Cursor·Codex가 같은 증거를 사용

한계:

- 자동 검증·우선순위 품질은 공개 벤더 주장이다.
- 연결 소스가 많아져도 표본 편향과 잘못된 분류가 자동으로 해결되지는 않는다.

## 3. discovery-agents-handoff OSS

[GitHub 저장소](https://github.com/klausners/discovery-agents-handoff)는 원자료 폴더를 evidence-linked Opportunity Solution Tree로 바꾸는 Claude Code 스킬이다.

```text
input pre-check
  → source extractor
  → fidelity critic
  → editor
  → deterministic theme aggregation
  → opportunity synthesizer
  ↔ independent MECE judge
  → outcome clustering
  → deterministic HTML render
```

주목할 패턴:

- 인용문 SHA-256 잠금
- 숫자 근거가 없으면 `needs validation`으로 표시
- 반대 증거를 별도 노출
- 새 자료만 다시 처리하는 증분 실행
- LLM 판단과 결정적 코드의 경계 분리

한계:

- 2026년 5월 생성된 별점 0개의 초기 저장소다.
- 설계 참고 사례이지 시장 채택이나 효과 증거가 아니다.

## 해외 방향의 공통점

| 층 | 공통 방향 |
|---|---|
| 입력 | 인터뷰 한 종류가 아니라 VOC·CRM·행동·시장 신호 통합 |
| 맥락 | 회사 전략·제품 구조·세그먼트·매출 정보 결합 |
| 처리 | 자동 분류와 지속적 추세 감지 |
| 신뢰 | 인용·출처·반대 증거로 역추적 |
| 판단 | 생성자와 독립 평가자 분리 |
| 산출물 | 요약문이 아니라 기회·스펙·실험·판정 |
| 학습 | 출시 후 결과를 원래 가설에 다시 연결 |

## 제품 설계에 적용할 때의 주의점

- 소스 수를 늘리는 것과 증거의 대표성을 높이는 것은 다르다.
- 매출이 큰 한 고객의 요청이 전체 시장 기회처럼 보이지 않도록 고객·ARR·빈도를 분리한다.
- AI 분류 결과에 세그먼트별 오류 대시보드를 붙인다.
- 자동 생성된 기회를 바로 PRD로 보내지 말고 고객 이야기와 행동 실험 게이트를 둔다.
- `항상 켜진 발견`은 자동 의사결정이 아니라 항상 최신 증거를 준비하는 시스템으로 정의한다.
