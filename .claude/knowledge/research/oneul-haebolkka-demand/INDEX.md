---
name: oneul-haebolkka-demand--index
description: 오늘 해볼까 수요 검증 리서치 토픽의 파일 안내 — 시장 스캔(market/MARKET_ANALYSIS.md)과 커뮤니티 VOC(community/INSIGHTS.md) 2건을 종합한 SUMMARY.md부터 읽으라는 안내와 조사 방법·핵심 발견 하이라이트.
metadata:
  type: research
  topic: oneul-haebolkka-demand
  category: index
  date: 2026-07-06
---

# 오늘 해볼까 — 수요 검증 리서치 INDEX

> 조사 대상: **"오늘 해볼까"** — 초보 1인 빌더 대상 (a) 취향/전문성 기반 앱 아이디어 슬롯머신 생성, (b) 아이디어 카드 공유 → 지인 투표 수요 확인 제품. 이 제품이 "만들지 결정 못 함" pain을 실제로 해결하는지, 유사 카테고리(아이디어 생성기/검증기)가 시장·커뮤니티에서 어떤 대접을 받는지 검증.
> 조사일: 2026-07-06 · 수집: 웹(WebSearch/WebFetch), Reddit(rdt-cli), X(twitter-cli), 국내(Jina/WebFetch)
> **먼저 읽을 것: [`SUMMARY.md`](SUMMARY.md)** — 아래 산출물 2건(시장·커뮤니티)을 종합한 최종 판정.

## 조사 방법

- **시장 스캔**: WebSearch/WebFetch로 IdeaBrowser·IdeasAI·Kernal·ValidatorAI·DimeADozen·IdeaProof 등 경쟁 제품의 가격·트랙션·지불 의사 신호 확인. 국내는 디스콰이엇 등.
- **커뮤니티 VOC**: rdt-cli(Reddit r/SideProject·r/indiehackers·r/SaaS·r/Startup_Ideas·r/AppIdeas), twitter-cli(영/한), 디스콰이엇(Jina 프록시+WebSearch)로 "뭘 만들지 모르겠다"·"만들었는데 반응 없다" 발화와 기존 툴에 대한 반응(공감/냉소) 수집.
- **한계**: 커리어리(로그인 장벽), 디스콰이엇 사이트 내 검색(404) 미수집 — SUMMARY.md 한계 절 참고.

## 산출물 구조

```
oneul-haebolkka-demand/
├── SUMMARY.md               ← 통합 요약: 종합 판정 + 지불 의사 실증 + 설계 반영 (여기부터 읽기)
├── INDEX.md                  ← 이 파일
├── market/MARKET_ANALYSIS.md ← 경쟁 제품 비교표·지불 의사 신호·시사점
└── community/INSIGHTS.md     ← Reddit/X/디스콰이엇 VOC 원문 인용 + 종합 판정
```

## 핵심 발견 하이라이트 (상세는 SUMMARY.md)

1. **종합 판정: 수요 신호 중~강, 단 포지셔닝 조건부.** "뭘 만들지 모르겠다"는 pain은 영·한 커뮤니티에서 반복 확인되지만, "아이디어 생성기/검증기" 카테고리 자체에 대한 냉소가 강하다(솔루션 피칭 글은 점수 0~2, 문제 공감 글만 흥함).
2. **지불 의사는 순수 생성(IdeasAI·ValidatorAI)이 아니라 1회성 소액 리포트($9~€99, DimeADozen·IdeaProof)에서 성립** — 오늘 해볼까의 990원/1,900원 마이크로 결제 설계와 정합.
3. **"지인 투표" 유료 시장은 국내외 미발견 공백** — 기회이자 경고(카톡+구글폼이라는 무료 대체재가 이미 있음).
4. **커뮤니티가 처방하는 대안("유저 5명과 대화하라")이 곧 투표 카드 기능** — 마케팅 카피를 냉소 진영의 언어로 쓸 수 있음.
5. **설계 반영**: "아이디어 생성기" 포지셔닝 금지, 씨앗 기반 전환 + 수요 리포트 과금 유지, 디스콰이엇은 경쟁자가 아닌 배포 채널로 활용.
