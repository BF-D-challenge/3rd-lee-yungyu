# 바이럴 K가 높은 제품 구조 리서치

- 조사일: 2026-07-15
- 신뢰 수준: L1 초안 — 제품 결정 전 사용자 검토 필요
- 대상 제품: Gas, Typeform, Calendly, Zoom, Wordle, Loom, Dropbox
- 제품 맥락: `오늘 해볼까`의 완성 아이디어 공유 → 사람 피드백 → 수신자도 새 아이디어 생성 루프
- 핵심 질문: 어떤 제품이 사용자의 정상적인 핵심 행동만으로 새 사용자를 만들었으며, 그 구조를 다크패턴 없이 이식할 수 있는가?

## 먼저 읽을 문서

- [SUMMARY.md](SUMMARY.md): 결론, 추천 조합, K7 측정식, MVP 제안
- [market/MARKET_ANALYSIS.md](market/MARKET_ANALYSIS.md): 제품별 구조·근거·위험 상세 비교

## 조사 방법

1. 저장소의 기존 Gas·Tinder 조사와 현재 `오늘 해볼까` Flow A/B를 기준선으로 사용했다.
2. Firecrawl 검색·스크레이프로 공식 페이지, SEC 신고서, 창업자 발표, 제품 책임자 인터뷰를 우선 수집했다.
3. 공개된 정확한 K 값과 가입 기여도, 제품 규모, 구조적 추론을 서로 구분했다.
4. `K = 사용자당 유효 초대 수 × 초대받은 사람의 활성 사용자 전환율`로 통일했다.

## 수집 도구와 명령

Firecrawl CLI 상태를 확인한 뒤 검색 15개와 핵심 페이지 스크레이프를 병렬 실행했다. 원본 캐시는 Git에서 제외된 `.firecrawl/viral-k-products/`에 보관했다.

```bash
firecrawl --status
firecrawl search "제품명 viral loop growth evidence" --limit 10 --scrape --scrape-formats markdown -o .firecrawl/viral-k-products/{name}.json --json
firecrawl scrape "https://source-url" --only-main-content -o .firecrawl/viral-k-products/{name}.md
```

## 근거 등급

- **A**: 회사 공식 자료, SEC 신고서, 창업자 원자료, 정확한 K 또는 가입 기여도 공개
- **B**: 회사 임원 인터뷰 또는 공식 규모 + 제품 안에서 확인 가능한 반복 구조
- **C**: 2차 사례 분석만 존재. 방향 참고용이며 수치 주장은 하지 않음

## 수집 제약

- 대부분의 회사는 정확한 K를 공개하지 않는다. 따라서 Gas 외 제품을 “K>1”이라고 단정하지 않는다.
- 커뮤니티·소셜 VOC는 이번 질문의 핵심이 제품 성장 구조였기 때문에 별도 수집하지 않았다.
- 모든 수치는 해당 자료의 발표 시점 값이다. 현재 사용자 수로 해석하지 않는다.
