---
name: idea-tools-2026--deliverable-anatomy
description: IdeaBrowser(11섹션 리포트)·DimeADozen(8섹션 $9/$129 검증 리포트)·GummySearch·Exploding Topics의 결제 순간 딜리버러블을 목차·근거출처·무료유료 경계·재방문 장치 단위까지 실물 해부하고 "오늘 해볼까"와의 갭 3줄씩 짚은 심층 분석.
metadata:
  type: research
  topic: idea-tools-2026
  category: deep
  date: 2026-07-07
---

# 아이디어 도구 "최종 가치물" 해부 — IdeaBrowser · DimeADozen · GummySearch (+Exploding Topics)

> 리서치 일자: 2026-07-07 · 목적: "오늘 해볼까"의 현 산출물(조합 문장 한 줄 + 지인 투표 카드 + 블러 리포트 가짜문)이
> 유행 제품들의 **결제 순간 딜리버러블** 대비 어디가 비었는지 목차 수준으로 확정.
>
> 수집 방법 주석: ideabrowser.com 본체는 WebFetch 반복 429(서버 측 rate limit)로 직접 열람 실패.
> 대신 **라이브 사이트를 스크레이핑하는 서드파티 2종**(n8n 워크플로우의 페이지 목록, Apify 스크레이퍼의 출력 스키마)으로
> 실제 페이지 구조를 필드 단위까지 복원했다 — 리뷰 글보다 오히려 정확한 소스. DimeADozen은 실제 샘플 리포트 전문을 직접 열람.

---

## 1. IdeaBrowser.com — "매일 1개, 완제품 리포트를 무료로 흘리는" 모델

### 1-1. 딜리버러블 목차 (아이디어 1개당 페이지/블록, 원문 명칭)

아이디어 1개가 **11개 인사이트 페이지**로 구성된다 (n8n 워크플로우가 순회하는 실제 경로 기준):

| # | 페이지/블록 | 내용 |
|---|---|---|
| 1 | **Idea of the Day** (메인) | 제목·문제/해결 요약, 배지(예: "Perfect Timing"), 분류(type: SaaS/App 등, market: B2B/B2C, target, mainCompetitor) |
| 2 | **Why Now** | 시장 타이밍 논거 (서술형) |
| 3 | **Proof & Signals** | 수요 증거 서술 |
| 4 | **Market Gap** | 경쟁 공백 |
| 5 | **Execution Plan** | 런칭 전략 |
| 6 | **Value Ladder** | 3단 가격 사다리: **leadMagnet(무료/저가 진입) → frontend(중간) → core(본상품)**, 각각 이름·가격·설명 포함 |
| 7 | **Value Equation** | (호르모지식) 가치 방정식 평가 |
| 8 | **Value Matrix** | 가치 매트릭스 |
| 9 | **ACP** | Avatar–Channel–Problem 프레임워크 |
| 10 | **Community Signals** | **Reddit(스레드 수·서브레딧 구독자·점수) / Facebook(그룹 수·멤버·점수) / YouTube(영상 수·점수) / other** — 플랫폼별 정량 시그널 |
| 11 | **Keywords** | 키워드별 **월 검색량(volume) + YoY 성장률(growth %)** 배열 |

여기에 메인 페이지 상단 **스코어카드**:
- 4대 점수(각 1–10): **Opportunity / Problem / Feasibility / Timing**
- **Business Fit** 오브젝트: revenuePotential($~$$$ 티어+ARR 추정), executionDifficulty(난이도+기간), goToMarket 점수, rightForYou(파운더 핏)
- 마케팅 클레임: "각 아이디어 = **50+ 시간 리서치를 10분 읽기로 압축**"

소스: [n8n 워크플로우(스크레이핑 경로 11개)](https://n8n.io/workflows/4901-daily-business-idea-insights-aggregator-from-ideabrowser-to-google-docs/) · [Apify Ideabrowser Scraper(출력 스키마 전체)](https://apify.com/marielise.dev/ideabrowser-scraper) · [aipure 제품 설명](https://aipure.ai/products/ideabrowser-com)

### 1-2. 근거 데이터의 출처

- Greg Isenberg 본인 서술: "**it scans FB groups, subreddits and Google Trends** to give you ideas that have the highest likelihood of success" — 즉 커뮤니티 시그널·키워드 볼륨은 실데이터 계열, 서술 섹션(Why Now, Execution Plan 등)은 AI+휴먼 큐레이션. 런칭 포스트: "It using **AI agents (and humans)** to give you startup ideas you can steal."
- 단, 비판점(경쟁사 비교 페이지): Research Agent 산출물은 "**does not link claims to data sources, so you cannot verify any specific number**" — 개별 수치의 출처 링크는 없음.

소스: [Greg 블로그](https://www.gregisenberg.com/blog/find-winning-startup-ideas-from-ai-and-data) · [LinkedIn 런칭 포스트](https://www.linkedin.com/posts/gisenberg_im-launching-a-new-startup-called-ideabrowsercom-activity-7331731471465914368-gQR3) · [preuve.ai 비교](https://preuve.ai/compare/alternatives-to/ideabrowser)

### 1-3. 무료 ↔ 유료 경계

- **무료: "오늘의 아이디어" 1개/일 — 그런데 그 1개는 위 11개 섹션이 전부 열린 완제품이다.** Apify 스크레이퍼가 "requires no login/subscription. It extracts the publicly available Idea of the Day"로 확인. Greg의 X 홍보: "there's a **free plan that gives 1 startup idea per day, 365 year, free forever** to get your creative juices flowing."
- **유료가 잠그는 것은 리포트 품질이 아니라 "수량·탐색·개인화"**: 아이디어 데이터베이스 1,000+개 브라우징, 트렌드 리포트, AI 아이디어 생성(20개/월), 자기 아이디어에 대한 Research Agent 리포트, Founder-Fit, 코칭.
- 가격 변천(둘 다 실측 스냅샷): 초기 Free $0 / Starter **$299/yr** / Pro **$999/yr** ([SwipeFile 스냅샷](https://swipefile.com/ideabrowser-free-starter-and-pro-pricing-page)) → 2026 현재 Starter **$499/yr**(DB+AI 생성 20/월) / Pro **$1,499/yr**(Research Agent 3회/월) / Empire **$2,999/yr**(9회/월+Jordan Mix 주간 코칭+Greg 월간 AMA) ([preuve.ai](https://preuve.ai/compare/alternatives-to/ideabrowser)). 연간 결제만 받음(비판점).

### 1-4. 재방문 장치

- **데일리 드립이 제품의 뼈대**: 매일 새 아이디어 1개 + 이메일. 테어다운 분석: 데일리 케이던스로 "**FOMO and habit**"을 설계, 팟캐스트를 "The Startup Ideas Podcast"로 개명해 "startup ideas" 카테고리 검색을 선점 → IdeaBrowser로 흘리는 퍼널. IdeaBrowser 자체가 "PDF 리드마그넷이 아니라 **오늘 고통을 해결하는 마이크로 툴**"로서의 리드마그넷.
- Greg의 프레임(정확 인용 가능한 것들): "In 2024, **execution is worthless. Ideas are everything.**" / "The shift from code to content is undeniable… the ability to grab attention and spread ideas has become the new technical skill." / "Ideas matter, but **the ability to spread them is transformative**." ("startup ideas are the new content"라는 정확한 문구는 검색상 미확인 — 위 인용들이 실제 소스가 있는 가장 가까운 프레임.)

소스: [startupspells 테어다운](https://startupspells.com/p/greg-isenberg-ideabrowser-lead-magnet-wantrepreneurs-startup-ideas-podcast/) · [X 포스트](https://x.com/gregisenberg/status/1939401459851985356) · [Marketers are the New Engineers](https://www.gregisenberg.com/blog/marketers-new-engineers) · [Why ideas matter more than ever](https://www.gregisenberg.com/blog/why-ideas-matter-more-than-ever)

### 1-5. "오늘 해볼까" 대비 갭 3줄

1. **맛보기가 완제품**: IdeaBrowser는 무료 1개에도 4점수+검색량+커뮤니티 시그널+가격 사다리까지 다 준다. 우리는 무료 산출물이 조합 한 문장 — 맛보기 단계에서 이미 "리포트란 이런 것"을 학습시키지 못한다.
2. **문장에 숫자 근거가 붙는다**(키워드 volume/growth %, 서브레딧 구독자 수). 우리 조합문에는 믿을 이유 레이어가 0층 — 블러 가짜문은 근거가 '있는 척'조차 구조화돼 있지 않다.
3. **내일 또 올 이유(데일리 드립)가 제품 골격**인데 우리 슬롯 릴은 세션 내 리롤만 있고 다음날 재방문 트리거가 없다.

---

## 2. DimeADozen.ai — "만들까 말까, 한 번의 결정을 파는" 모델

### 2-1. 딜리버러블 목차 (샘플 리포트 "Munchery autopsy" 실물 기준, 원문 명칭)

랜딩 대분류 4개: **Business overview / Market research / Launch and scale / Validation**.
샘플 리포트 실제 목차(8개 대섹션):

1. **Summary** — 한 줄 판정("fatal lever는 X가 아니라 Y였다") + **Viability Score 65/100** ("Execution-dependent path")
2. **Business Overview** — 비즈니스 모델, 시장 규모 수치, 페인포인트, 차별화, 유사 선례(Freshly→Nestlé 인수 등)
3. **Monetization Strategies** — Safe/Core 전략(각각 **가격대 + Year 1–3 매출 프로젝션 + 경쟁사 가격 근거**) / Novel 전략(파일럿 아이디어) / Pricing Research Summary(경쟁 중앙값, 권장 앵커 가격, 마진 타깃)
4. **User Pain Points** — 페인포인트별 3단 정량화: **Cost of inaction(방치 비용) → 솔루션 → Value created(창출 가치)** + Market Validation + **Urgency 8/10**
5. **Revenue and Market Opportunities** — **TAM($20.61B) / SAM($9,275M, 산출 논리 포함) / SOM(3개년, 침투율 가정 명시)** + 고객 가정(객단가·빈도·연간 지출) + **Comparable exits**(인수가 실액)
6. **Potential Risks** — 리스크 레지스터: 시장/기술/재무/규제/팀 각각에 **Probability × Impact + Early warning + Mitigation + Contingency** + Black Swans + 우선순위(지금/관찰/수용) + **Overall Risk Score 8/10(±신뢰구간)**
7. **Why Now** — Financial changes(금리·인플레·VC 자금) / Behavioral shifts / Technology drivers → 종합
8. **Validate Unknown Factors** — **단계별 실험 3개**, 각각: 가설(수치 임계값) → 실험 설계(A/B, RCT, 요인설계) → **표본 수 계산(검정력 명시) → 성공 지표(벤치마크 출처) → 타임라인(주 단위) → 예산(항목별 달러)**

소스: [샘플 리포트 전문](https://www.dimeadozen.ai/sample-report/munchery) · [랜딩](https://www.dimeadozen.ai/)

### 2-2. 근거 데이터의 출처

- 셀링 포인트가 검증가능성 그 자체: "**800+ URL citations across 140+ named sources**" (샘플엔 "1,200+ URL citations" 표기), "Source-linked so you can check every claim", "**verifiable, not LLM-hallucinated**", 컴셋은 "public S-1s and 10-Ks"에서.
- 실제 인용원: McKinsey, Statista, USDA/ERS, Grand View Research, TechCrunch/Bloomberg(인수·파산 보도), FDA Food Code, Shopify 벤치마크 등 — 섹션마다 명명된 출처가 붙음.

### 2-3. 무료 ↔ 유료 경계

- **무료: "2-minute idea-score"** (즉석 점수 맛보기) → **$9 스타터 리포트** → **$129 풀 "Entrepreneur" 리포트(200+페이지)**. 구독 아님, 일회성 구매, 14일 환불 보장.
- 파는 것의 정의가 명확: "Built for one decision: **should you build this?**" — $129에 "**a clear build-or-don't-build verdict**"를 준다.

### 2-4. 재방문 장치

- **거의 없음(의도적)**. 일회성 결정 상품이라 드립/스트릭 없음. 재방문은 "다음 아이디어가 생겼을 때". → 리텐션 대신 **낮은 진입가($9)와 환불 보장으로 결제 전환**에 올인한 구조. (IdeaBrowser와 정확히 반대 극.)

### 2-5. "오늘 해볼까" 대비 갭 3줄

1. **판정이 없다**: DimeADozen은 점수(65/100)+리스크 점수+명시적 verdict로 "결정을 대신"해준다. 우리 지인 투표는 감상 수집이지 판단이 아니며, 사용자가 결제할 '결정의 순간'을 만들지 못한다.
2. **불편의 정량화 문법**: 페인포인트마다 "방치 비용→해결→창출 가치→Urgency 점수" 4단 구조. 우리 '불편(고민)' 축 카드는 명사 한 개 수준 — 같은 카드를 이 문법으로 전개하면 그대로 유료 섹션이 된다.
3. **다음 행동의 구체성**: 가설·표본수·예산·기간이 박힌 실험 3개까지 준다. 우리 "실행 플랜"은 블러 가짜문으로만 존재 — 결제해도 받을 실물이 정의돼 있지 않다.

---

## 3. GummySearch — "실제 사람의 원문 인용이 영수증"인 발견 모델 (2025-11 상업 종료)

### 3-1. 딜리버러블 구조 (UI 흐름, 원문 명칭)

1. **Audience 생성**: 키워드("Solopreneurs" 등)로 서브레딧 검색 → 멤버 수·설명 보고 복수 선택 → "2–4 keywords relevant to your audience" 추가 → **Create Audience** (130,000+ 서브레딧 풀)
2. **Themes(큐레이션 카테고리 탭)**: **Hot Discussions / Top Content / Pain & Anger / Advice Requests / Solution Requests / Money Talk / Seeking Alternatives** — 대화를 감정·의도별로 자동 분류
3. **AI Patterns/Summaries**: 카테고리별 AI 요약이 반복 테마를 클러스터링 ("groups related discussions together")
4. **원문 드릴다운**: 클러스터 → **실제 Reddit 대화 인용문**(사용자 언어 그대로) — 이것이 최종 가치물
5. **Ask(질의)**: "What are the pain points solopreneurs face using AI?" 같은 자연어 질문 → 해당 대화 발췌 반환
6. **Alerts/Tracking**: 키워드·브랜드 언급 알림, 경쟁사 불만 추적

핵심: 유저가 마지막에 손에 쥐는 것은 **"테마 클러스터 + 볼륨 수치 + 실명 대화 원문 인용"** — 리뷰 표현으로 "Everything GummySearch shows you is publicly available on Reddit… you're paying for **time savings and organization**."

소스: [사용 흐름 상세](https://newsletter.deepwriting.ai/p/gummysearch-reddit-series-1-basics) · [제품 페이지](https://gummysearch.com/product/) · [리뷰](https://painonsocial.com/blog/is-gummysearch-worth-it) · [startupik 리뷰](https://startupik.com/gummysearch-the-reddit-research-tool-for-finding-real-audience-pain-points/)

### 3-2. 근거 데이터의 출처

- **100% 실데이터**: Reddit API 실시간 대화. LLM은 생성이 아니라 **분류·요약에만** 사용. 근거의 강도가 4개 제품 중 최고(반박 불가능한 실제 발화).
- 그리고 그 데이터 의존이 사인(死因): Reddit Data API 라이선스 합의 실패로 종료. 파운더 Fed: "we were not able to reach an agreement that aligns with Reddit's Data API Usage policies… My goal is to build a sustainable business, and that's hard to do when you are looking over your shoulder every day." 135,000+ 사용자 상태에서 폐업 결정.

### 3-3. 무료 ↔ 유료 경계 (종료 전 기준)

- **Free: 키워드 검색 50회** + 기본 커뮤니티 탐색. **Starter $29/mo**: 무제한 검색 + **AI 인사이트(Patterns)** + 고급 검색. **Pro $59/mo**, **Mega $199/mo** (트래킹 커뮤니티 수·알림 수 증가). 연간 33% 할인.
- 경계선의 논리: **원자료 탐색은 무료, "패턴을 대신 읽어주는 AI"부터 유료.**

### 3-4. 재방문 장치

- **Alerts(키워드/브랜드 알림)와 트래킹 피드** = 소셜 리스닝 루프. 새 대화가 계속 생기므로 데이터 자체가 재방문 사유.
- 타임라인: 신규 가입·결제 2025-11-30 종료 → 기존 고객 청구 주기까지 → **2026-12-01 전체 데이터 삭제**. ([Final Chapter](https://gummysearch.com/final-chapter/) · [종료 후 대안 비교](https://www.subredditsignals.com/blog/subreddit-signals-vs-gummy-search-real-demand-in-2026))

### 3-5. "오늘 해볼까" 대비 갭 3줄

1. **수요 증거의 급이 다르다**: 우리 증거는 지인 투표 n≤10인데, GummySearch류는 "모르는 타인 수백 명의 원문 발화"를 영수증으로 준다. 아이디어 문장 옆에 실제 커뮤니티 인용 1~2개만 붙어도 증거의 성격이 바뀐다.
2. **'불편' 축의 실데이터화 모델**: Pain & Anger / Solution Requests / Money Talk 분류는 우리 불편·고민 카드를 정적 덱이 아니라 살아있는 클러스터로 만들 수 있는 설계도다(한국이면 네이버 카페·당근·X 등).
3. **경계선 교훈**: 원자료는 무료, "대신 읽어주는 패턴"부터 과금 — 우리도 투표 원자료(누가 눌렀나)는 무료, 해석(어떤 유형이 왜 반응했나)을 유료로 놓는 문법이 이식 가능. + 단일 플랫폼 API 의존은 폐업 리스크.

---

## 4. (보조) Exploding Topics Pro — "선별된 그래프 한 장"의 힘

- **딜리버러블**: 토픽별 **성장 상태 태그(exploding / regular / peaked) + 검색 관심도 트렌드 그래프**, **Meta Trends**(대형 니치를 구성하는 마이크로 트렌드·토픽·브랜드 묶음 리포트), **Forecast**(12개월 예측, "87% 정확도" 클레임), 주간 트렌드 리포트 이메일.
- **근거**: 실제 검색 관심도 시계열(구글 트렌드 계열) + 자체 큐레이션 — 생성형 아님.
- **경계**: 무료는 공개 트렌드 리스트 일부. **Entrepreneur $39/mo**(연간 청구): 전체 DB+Meta Trends+주간 리포트 / **Investor $99**: Forecast·CSV·API / **Business $249**: 팀·커스텀 트래킹.
- **재방문**: 주간 리포트 뉴스레터 + DB에 트렌드 계속 추가.
- **시사점 1줄**: 근거 레이어를 "그래프 한 장"으로 시각화하는 것만으로 딜리버러블이 성립한다 — 우리 카드 뒷면에 붙일 수 있는 최소 단위.

소스: [alexang 리뷰](https://alexang.co/exploding-topics-review/) · [topicfinder 가이드](https://www.topicfinder.com/exploding-topics-guide/) · [makerstack 리뷰](https://makerstack.co/explodingtopics-review/)

---

## 5. 종합 — 결제 순간 딜리버러블의 공통 해부도

4개 제품이 돈 받는 순간 건네는 것은 예외 없이 아래 4층 구조다. "오늘 해볼까" 현 산출물은 1층(문장)만 있다:

| 층 | IdeaBrowser | DimeADozen | GummySearch | Exploding Topics | 오늘 해볼까 (현재) |
|---|---|---|---|---|---|
| **① 판정/점수** (숫자화된 확신) | 4점수(1–10)+Business Fit | Viability 65/100 + build/don't verdict + Risk 8/10 | (없음 — 대신 볼륨) | 성장 상태 태그+예측 | 없음 |
| **② 근거 레이어** (믿을 이유) | 키워드 volume/growth + 커뮤니티 시그널 정량 | 800+ 출처 링크, S-1/10-K | **실제 대화 원문 인용** | 검색 시계열 그래프 | 없음 (블러 가짜문) |
| **③ 다음 행동** | Execution Plan + Value Ladder(가격 3단) + ACP | 실험 3개(가설·표본·예산·기간) | Ask→인용 발굴 | (약함) | 없음 |
| **④ 재방문 드립** | 데일리 아이디어+이메일 | 없음(일회성 $9/$129) | 알림/트래킹 | 주간 리포트 | 투표 결과 확인뿐 |

**추가 관찰 3개:**
1. **무료의 역할이 다 다르다**: IdeaBrowser는 "완제품 1개/일"(품질을 보여주고 수량을 판다), DimeADozen은 "2분 점수"(판정 맛보기 후 깊이를 판다), GummySearch는 "원자료 50회"(자료를 보여주고 해석을 판다). 공통점은 **무료 단계에서 이미 유료 딜리버러블의 '형태'가 완전히 보인다**는 것 — 블러 처리된 가짜문은 이 중 어느 문법에도 해당 없음.
2. **한국형 근거 레이어 후보**(② 층을 채울 때): 네이버 검색량(데이터랩), 네이버 카페/당근 게시글, X·스레드 발화 — GummySearch의 Reddit 역할을 무엇이 하는지가 우리 ②층의 실현 가능성을 결정. 단 GummySearch의 폐업 사유(플랫폼 API 정책)가 그대로 리스크.
3. **우리 고유 자산은 ④층에 이미 씨앗이 있다**: 투표는 재방문(결과 확인) 장치이면서 동시에 "실명 지인의 반응"이라는 이 제품들에 없는 근거 유형이다. 투표 데이터를 ①(찬성률 점수화)·②(누가/어떤 코멘트)로 승격해 리포트에 통합하면, 4층 구조를 외부 데이터 없이도 부분 충족할 수 있다.

---

### 전체 소스 목록

- IdeaBrowser: https://n8n.io/workflows/4901-daily-business-idea-insights-aggregator-from-ideabrowser-to-google-docs/ · https://apify.com/marielise.dev/ideabrowser-scraper · https://preuve.ai/compare/alternatives-to/ideabrowser · https://swipefile.com/ideabrowser-free-starter-and-pro-pricing-page · https://aipure.ai/products/ideabrowser-com · https://startupspells.com/p/greg-isenberg-ideabrowser-lead-magnet-wantrepreneurs-startup-ideas-podcast/ · https://www.gregisenberg.com/blog/find-winning-startup-ideas-from-ai-and-data · https://x.com/gregisenberg/status/1939401459851985356 · https://www.linkedin.com/posts/gisenberg_im-launching-a-new-startup-called-ideabrowsercom-activity-7331731471465914368-gQR3 · https://www.gregisenberg.com/blog/marketers-new-engineers · https://www.gregisenberg.com/blog/why-ideas-matter-more-than-ever
- DimeADozen: https://www.dimeadozen.ai/ · https://www.dimeadozen.ai/sample-report/munchery
- GummySearch: https://gummysearch.com/product/ · https://gummysearch.com/final-chapter/ · https://newsletter.deepwriting.ai/p/gummysearch-reddit-series-1-basics · https://painonsocial.com/blog/is-gummysearch-worth-it · https://painonsocial.com/blog/how-much-does-gummysearch-cost · https://startupik.com/gummysearch-the-reddit-research-tool-for-finding-real-audience-pain-points/ · https://www.subredditsignals.com/blog/subreddit-signals-vs-gummy-search-real-demand-in-2026
- Exploding Topics: https://alexang.co/exploding-topics-review/ · https://www.topicfinder.com/exploding-topics-guide/ · https://makerstack.co/explodingtopics-review/
