# 오늘 해볼까 — 시장/경쟁 분석 (아이디어 생성 + 수요 검증 도구)

- 조사일: 2026-07-06
- 조사 방법: 웹 검색/페이지 확인 (WebSearch, WebFetch). 확인 불가 항목은 "미확인"으로 표기.
- 대상 제품: "오늘 해볼까" — 초보 1인 빌더 대상 (a) 취향/전문성 기반 앱 아이디어 슬롯머신 생성, (b) 아이디어 카드 공유 → 지인 투표 수요 확인. 수익화: 실행 플랜 990원, 오늘 패스 1,900원.

---

## 1. 경쟁 제품 비교 테이블

### 1-1. 아이디어 생성/발굴 도구

| 제품 | 가격 | 트랙션 | 차별점 / 비고 | 출처 |
|---|---|---|---|---|
| **IdeaBrowser** (Greg Isenberg) | 연간 결제만: Starter $299/yr, Pro $999/yr, Empire $2,999/yr (출처별로 Starter $499/Pro $1,499 표기도 존재 — 가격 변동 이력 추정, 정확 최신가 미확인). 무료 티어: 하루 1개 아이디어 이메일 | 2025-06 Product Hunt 런칭: 517 upvotes, Day #3. 2025-07 월 방문 669K(+704%) 보도. 유료 구독자 수/매출 미확인 | Reddit·검색·트렌드 데이터를 스캔해 "검증된" 아이디어를 큐레이션 + 실행 플랜·proof signal까지 제공. Greg Isenberg의 팟캐스트/뉴스레터(15만+ 구독) 오디언스가 유통 채널. PH에서 Chris Messina가 "실행이 중요한데 아이디어에 값을 매기는 게 맞나" 회의론 제기 | [pricing](https://www.ideabrowser.com/pricing), [SwipeFile](https://swipefile.com/ideabrowser-free-starter-and-pro-pricing-page), [PH](https://www.producthunt.com/products/ideabrowser-com), [aipure](https://aipure.ai/products/ideabrowser-com), [startupspells](https://startupspells.com/p/greg-isenberg-ideabrowser-lead-magnet-wantrepreneurs-startup-ideas-podcast/) |
| **IdeasAI** (Pieter Levels, GPT-3→Grok 기반) | 무료 열람 + "아이디어 독점 클레임" 유료 옵션 (정확 가격 미확인) | 2020년 런칭, PH Product of the Month #3, 시간당 ~75개 아이디어 생성. 이후 Levels 본인이 실패 프로젝트로 분류. 사이트는 Grok 기반으로 잔존 | 순수 AI 랜덤 생성 + 주간 이메일 큐레이션. 투표로 좋은 아이디어를 걸러내는 구조였으나 지속 수익화 실패 — "생성만으로는 돈이 안 된다"는 대표 반례 | [ideasai.com](https://ideasai.com/), [PH](https://www.producthunt.com/products/ideasai), [MarkTechPost](https://www.marktechpost.com/2020/09/08/meet-ideasai-a-gpt-3-powered-business-idea-generator/), [indielessons](https://indielessons.com/founder/pieter-levels/) |
| **Kernal** (kern.al) | 무료 커뮤니티 (유료 티어 존재 여부 미확인) | 사용자 5,000명 + 아이디어 1,000개 돌파(Indie Hackers 발표 시점), 뉴스레터 10,000명 (HubSpot 창업자 Dharmesh Shah 등 포함) | 아이디어 공유·투표·빌드인퍼블릭 커뮤니티. 수요 확인을 "커뮤니티 투표"로 푸는 모델 — 오늘 해볼까의 (b)와 가장 유사하나 무료 | [IH](https://www.indiehackers.com/post/kernal-passes-5-000-users-and-1-000-startup-ideas-b8219a878f), [beehiiv](https://www.beehiiv.com/blog/creator-spotlight-joel-hansen), [creatorspotlight](https://www.creatorspotlight.com/p/kernal) |
| **ValidatorAI** | 무료 (생성+검증+런치 시뮬레이션) | "300K+ founders" 사용 주장 (자사 표기, 독립 검증 미확인) | 아이디어 생성과 AI 검증을 무료로 제공 — 이 카테고리 하한 가격을 0원으로 끌어내리는 존재. 랜딩페이지 목업까지 무료 생성 | [validatorai.com](https://validatorai.com/) |
| **DimeADozen.ai** | 1회성 리포트 $9 (구독 없음) | 사용자 수 미확인 | "구독 아닌 소액 1회 결제" 모델의 실존 사례 — 오늘 해볼까의 990/1,900원 마이크로 결제와 구조가 가장 유사 | [dimeadozen.ai](https://www.dimeadozen.ai/) |
| **IdeaProof** | 크레딧제: Starter €19.99(150cr) / Builder €49.99(700cr) / Founder €99.99(1500cr) | "10,000+ verified entrepreneurs" 주장 (자사 표기, 독립 검증 미확인) | AI가 120초 내 아이디어 시장성 분석. 크레딧 소액 결제형 | [ideaproof.io](https://ideaproof.io/), [비교글](https://worthbuild.io/blog/best-startup-idea-validation-tools-2026-comparison) |

### 1-2. 한국 제품

| 제품 | 가격 | 트랙션 | 차별점 / 비고 | 출처 |
|---|---|---|---|---|
| **디스콰이엇 (disquiet.io)** | 무료 (메이커 커뮤니티) | 시드 투자 유치. 사용자 수 최신치 미확인 | 한국판 Product Hunt — 제품 등록·투표·빌드인퍼블릭. "만든 것"의 검증 채널이지 "아이디어 단계" 검증 도구는 아님. 국내 1인 빌더가 모여 있는 유통 채널로서 의미 | [disquiet.io](https://disquiet.io/), [회고](https://www.disquiet.tech/post/disquiet-seed-round-retrospective-1) |
| 국내 "아이디어 생성/검증" 전용 유료 서비스 | — | **미확인** — 검색 범위 내에서 오늘 해볼까와 동일 포지션(아이디어 슬롯 생성 + 지인 투표)의 국내 유료 서비스는 발견하지 못함. 정부지원형(모두의 창업 AI 솔루션) 또는 커뮤니티(지피터스 등)가 인접 영역 | 직접 경쟁 공백으로 보이나, 수요 부재의 신호일 수도 있음 | [modoo.or.kr](https://www.modoo.or.kr/ai-solution/list), [gpters.org](https://www.gpters.org/) |

---

## 2. 아이디어 "검증/수요 확인" 도구 카테고리

| 제품 | 가격 | 비고 | 출처 |
|---|---|---|---|
| **Prelaunch.com** | 유료 플랜 (정확 가격 미확인). 소비자가 소액 보증금으로 예약 → 실구매 의사 측정 | "100만+ 소비자 커뮤니티" 주장. 하드웨어/D2C 제품 중심 (e-bike 사례 등). 실결제 기반 검증이라는 점에서 강한 시그널 제공 | [prelaunch.com](https://prelaunch.com/features/concept-validation.html), [bike-eu 사례](https://www.bike-eu.com/46021/from-concept-to-reality-how-e-bike-creators-find-success-with-prelaunch-coms-validation) |
| **FakeDoorTest.com** | 미확인 | "가짜 문 테스트" 전용 도구가 별도 제품으로 존재할 만큼 카테고리가 형성됨 | [fakedoortest.com](https://fakedoortest.com/) |
| **LaunchList** (대기자 명단) | 1회 결제 $19(500 제출)~$299(10만 제출) | 대기자 수집이라는 검증 인프라에 1회성 소액 결제가 성립하는 사례 | [getlaunchlist 비교글](https://getlaunchlist.com/blog/best-free-waitlist-software-2026) |
| 관행적 벤치마크 | — | 업계 통용 기준: 랜딩 전환 10%+ 이면 강한 수요, 5% 미만이면 재고. "만들기 전에 3명이 돈 내겠다고 하면 그린라이트" | [ideascorer 가이드](https://ideascorer.io/blog/en/saas-validation-guide), [dowhatmatter](https://dowhatmatter.com/guides/fake-door-test), [userpilot](https://userpilot.com/blog/fake-door-testing/) |

카테고리 관찰: "검증" 쪽은 (1) AI 리포트형($9~€99, DimeADozen/IdeaProof), (2) 실트래픽 랜딩/대기자형($19~, LaunchList/Prelaunch), (3) 커뮤니티 투표형(무료, Kernal/디스콰이엇) 세 갈래. **"지인 투표"형 유료 도구는 검색 범위에서 미발견** — 지인 피드백은 보통 링크 공유+구글폼/카카오톡으로 무료 해결되는 영역.

---

## 3. 지불 의사 신호

**실제로 유료 전환이 관찰되는 지점:**

1. **큐레이션 + 유통 파워**: IdeaBrowser가 연 $299~2,999라는 고가에도 성립하는 이유는 AI 생성이 아니라 (a) 리서치가 붙은 큐레이션, (b) Greg Isenberg의 오디언스(뉴스레터 15만+), (c) 코칭/커뮤니티 번들. 즉 돈은 "아이디어"가 아니라 **신뢰할 만한 사람의 판단 + 실행 자료 + 소속감**에 지불됨. ([startupspells 분석](https://startupspells.com/p/greg-isenberg-ideabrowser-lead-magnet-wantrepreneurs-startup-ideas-podcast/), [pricing](https://www.ideabrowser.com/pricing))
2. **소액 1회 결제 리포트**: DimeADozen $9 리포트, IdeaProof €19.99 크레딧 — 구독 거부감이 큰 초보 빌더 대상으로 "이번 아이디어 하나만 확인" 결제가 성립. ([dimeadozen.ai](https://www.dimeadozen.ai/), [ideaproof.io](https://ideaproof.io/))
3. **순수 생성은 무료화됨**: IdeasAI는 PH 월간 3위까지 갔지만 Levels 본인이 실패로 규정 ([indielessons](https://indielessons.com/founder/pieter-levels/)). ValidatorAI는 생성+검증을 아예 무료로 배포하며 300K 사용자 주장 ([validatorai.com](https://validatorai.com/)). ChatGPT 무료 대체재까지 고려하면 "생성 그 자체"의 지불 의사는 사실상 0에 수렴.
4. **ChatGPT가 있는데도 내는 이유(관찰)**: 구조화된 워크플로(단계별 강제), 정리된 산출물(리포트/실행 플랜), 데이터 소스 결합(Reddit/트렌드), 그리고 "돈을 냈으니 실행한다"는 커밋먼트 효과. 단, 이 관찰의 상당 부분은 판매자 측 서사이며 독립 검증은 제한적 — PH에서도 "아이디어에 값 매기기" 회의론이 공존 ([PH 코멘트](https://www.producthunt.com/products/ideabrowser-com)).
5. **미확인**: IdeaBrowser·DimeADozen·IdeaProof의 실제 매출/전환율 수치는 공개 자료에서 확인 못 함. "10,000+ / 300K+ 사용자"류 수치는 자사 주장.

---

## 4. 오늘 해볼까에 주는 시사점

1. **"아이디어 생성"만으로는 과금 불가** — IdeasAI 실패와 ValidatorAI 무료화가 증명. 슬롯머신은 훅(재미·바이럴)으로 쓰고, 과금은 그 뒤 단계에 걸어야 함.
2. **990원 실행 플랜은 DimeADozen($9)류 "1회성 소액 리포트" 패턴과 정합적** — 다만 성립 조건은 산출물이 ChatGPT 복붙보다 눈에 띄게 구조화·개인화되어 있다는 체감. 가격 자체보다 산출물 품질이 관건.
3. **"지인 투표" 유료 시장은 공백** — 선례가 없다는 건 기회이자 경고. 지인 피드백은 카톡+구글폼으로 무료 해결 가능하므로, 투표 기능이 아니라 "투표 결과의 해석/다음 액션"(예: N표 이상이면 실행 플랜 자동 제안)에 가치를 얹어야 함.
4. **국내 직접 경쟁자는 미발견, 대신 디스콰이엇이 유통 채널** — 경쟁이 아니라 런칭/획득 채널로 활용 가능. 초기 사용자 획득은 디스콰이엇·지피터스 등 기존 1인 빌더 커뮤니티에 얹는 게 현실적.
5. **검증 벤치마크를 제품 안에 내장할 것** — 업계 통용 기준(전환 10%+, "돈 내겠다는 3명")처럼, 투표 수요 판정에 명시적 기준선을 제공하면 "무료 투표 → 유료 실행 플랜" 전환 논리가 자연스러워짐.
