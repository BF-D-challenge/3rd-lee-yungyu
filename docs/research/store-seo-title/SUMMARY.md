---
name: store-seo-title--summary
description: 앱스토어(Apple RSS·크롬 웹스토어) 상위 랭킹 제목 분석으로 "이름+구분자+검색키워드" 제목 공식을 도출하고, 오늘 해볼까 카드 40장의 제목을 브랜드 이름+SEO 부제 형태로 개선 적용한 기록.
metadata:
  type: research
  topic: store-seo-title
  category: summary
  date: 2026-07-08
---

# 스토어 SEO·USP 제목 리서치 → 카드 제목 개선

> 소스: `docs/research/store-rankings/`(Apple RSS 12개 스토어프론트·카테고리 차트 4,949행·크롬 웹스토어 고유 확장 2,022개·iTunes 키워드 샘플) + `docs/research/trustmrr-acquire/ideas.jsonl`. 수집 도구 없이 로컬 JSONL 분석.
> 목적: 실제 상위 앱들이 어떻게 제목을 지어 SEO·USP를 잡는지 확인하고, 우리 카드 제목(현행 "며칠 뛰었나 세주기"류)을 개선.

## 핵심 발견: 이기는 제목 공식

**[짧고 기억되는 이름] + 구분자(—, :) + [무엇을 해주는지 + 검색 키워드]**

실증 예시 (실제 상위 앱/확장):
- `Keepa — Amazon Price Tracker` · `TickTick — Todo & Task List` · `Session Buddy — Tab & Bookmark Manager`
- `TARO — Harmful Ingredients Checker` · `SponsorBlock for YouTube — Skip Sponsorships` · `Price Tracker — Price Drop Alerts & History Charts`
- 한국: `아이젠하워 매트릭스: 투두, 메모 우선순위 관리` · `TeraBox: 1TB 클라우드 저장소 & AI 공간` · `쿠팡이츠 - 와우회원 배달비 0원`

세 부분의 역할:
1. **이름** (2~5자, 기억·발음되는 브랜드형): Keepa·Drowzy·Topick·Pino·TARO 같은 조어 또는 기능 직역(Price Tracker·Meeting Timer). 스토어에서 재검색·구전을 만든다.
2. **구분자**: 한국 앱은 `-`(60/199) > `:`(19) 순으로 부제를 붙임. 크롬 확장은 `이름 - 기능`이 표준(614/2022).
3. **부제(USP+키워드)**: 구체적 결과 + 카테고리 검색어. "Price Drop Alerts", "Tab & Bookmark Manager", "와우회원 배달비 0원". **뭉뚱그린 형용사가 아니라 검색될 명사·수치.**

## SEO 진입 키워드 (iTunes 키워드 샘플 상위)

`developer tools · marketing · finance · productivity · notes · habit · calendar · fitness · email · ai · scanner · todo`
→ 부제에 **도메인 검색 키워드**(러닝 기록·습관·재고 관리·체크리스트·투표·레시피·가격 추적)를 반드시 넣어야 검색에 걸린다.

## 우리 카드의 문제

현행 제목은 **순수 기능 서술형**("며칠 뛰었나 세주기", "카페 투표로 정해주기"). 고등학생도 이해되는 장점은 있으나:
- **기억되는 이름이 없다** → 스토어 재검색·구전 0. (실제 승자는 전부 브랜드형 이름 보유)
- **검색 키워드가 약하다** → "며칠 뛰었나"는 아무도 검색 안 함. "러닝 기록"·"운동 습관"이 검색어.
- 부제(USP)와 이름이 한 덩어리라 위계가 없다.

## 개선 공식 (카드 제목 v8)

**title = [브랜드형 짧은 이름] — [무엇을 + 도메인 검색 키워드]**

| 현행 | → 개선(형식) |
|---|---|
| 며칠 뛰었나 세주기 | 런데이 — 안 끊기는 러닝 연속기록 |
| 카페 투표로 정해주기 | 카페픽 — 후보 3곳 3초 투표 |
| 품절 상품 미리 걸러주기 | 품절봇 — DM 주문 재고 알림 |
| 출시 전 빠진 거 찾기 | 런치체크 — 출시 전 체크리스트 |

- 이름: 발음되고 뜻이 짐작되게(러닝→런데이, 카페→카페픽). 없는 영어약어·업계용어 금지(고등학생 눈높이 유지).
- 부제: 기능 + **검색될 명사 키워드**(러닝 기록·투표·재고 알림·체크리스트).
- 이름·부제 길이 = 각 ≤6자 / ≤16자 정도. oneliner(통증→이점)는 그대로 유지.

## 적용 결과 (2026-07-08 완료)

- 40장(R20+B20) 제목을 공식대로 개선해 `src/data/combos.json` golden `title` 갱신 + 브랜드 이름을 `appName`으로 별도 보관. tsc·build 통과.
- **잔존 업계용어 맥락별 처리**(사용자 결정): 개발·실무 카드(UI·QA·대시보드·집계)는 타깃이 실제 검색하는 키워드라 유지, 소비자 카드만 풀어씀(R01 스트릭→"안 끊기는 러닝 연속 기록", R02 진단→"OTT 뭐 볼지 추천").
- 예: 며칠 뛰었나 세주기→**뛴날 — 안 끊기는 러닝 연속 기록**, 카페 투표로 정해주기→**카페픽 — 카페 투표·결정**, 품절 상품 미리 걸러주기→**품절봇 — 재고 품절 방지 알림**.
- 접미 컨벤션: 픽(추천·투표)·봇(자동·알림)·록/함(저장)·체크(체크리스트)·판(집계).
