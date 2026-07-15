# 한입코치 — 경쟁·유사 서비스 딥다이브 (2026-07-12)

## 1. Cal AI (해외 · 최우선 벤치마크)

- **구조**: 음식 사진 → 비전 AI로 칼로리·탄단지 추정 + 바코드/라벨/텍스트 보조. 2024-05 출시, 당시 17~18세 Zach Yadegari·Henry Langmack 공동 창업, 무투자 부트스트랩, 팀 7명.
- **가격**: 고정 가격표 없이 A/B·지역별 변동 — 대략 $2.99/주~$29.99/년. 3일 무료 후 자동 결제, 환불 사실상 불가 약관.
- **지표**: 2025년 매출 ~$30M(말 기준 $35M ARR 추정) → 2026-01 단월 $5.7M($50M+ 연환산). 다운로드 2025-03 100만 → 2025-07 830만 → 인수 시점 1,500만+.
- **마케팅**: 마이크로 인플루언서 150+명 리테이너, 목표 CPM $5·실측 $0.5~3. "What I eat in a day" 콘텐츠에 자연 삽입. 신규 TikTok 계정으로 알고리즘을 훈련해 FYP를 크리에이터 발굴기로 사용. 창업자 오가닉 영상 281개 선행 후 유료 광고.
- **뉴스·논란**:
  - **2026-03-02 MyFitnessPal이 인수**(금액 비공개, ~$100M설, 팀 전원 잔류).
  - **정확도 논란**: 자칭 "90% 정확도" 근거 미제시로 반박됨. 단순 음식 85~92%, 혼합 요리 오차 30~50%(대체로 과소집계). Lifehacker 테스트에서 사과→"티카 마살라" 오인식.
  - **2026-04 Apple이 앱스토어에서 일시 퇴출** — 기만적 결제 화면(주 단위 환산가 과대 표시·자동갱신 은폐·Stripe 임베드 IAP 우회). 수정 후 2026-06 재게시. 트라이얼 취소에도 $29.99 청구 불만 다수.
- **시사점**: 사진→칼로리 PMF는 검증 완료. 단 정확도 시비가 카테고리 아킬레스건이고 다크패턴 결제는 퇴출 리스크 실증. Cal AI는 "기록"까지만 — "행동 지시"는 공백.
- 출처: [TechCrunch 창업기](https://techcrunch.com/2025/03/16/photo-calorie-app-cal-ai-downloaded-over-a-million-times-was-built-by-two-teenagers/) · [CNBC](https://www.cnbc.com/2025/09/06/cal-ai-how-a-teenage-ceo-built-a-fast-growing-calorie-tracking-app.html) · [Inc.](https://www.inc.com/ben-sherry/he-built-an-ai-app-in-high-school-made-40m-and-sold-to-myfitnesspal-now-hes-aiming-even-bigger/91307748) · [TechCrunch 인수](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/) · [창업자 X($50M ARR)](https://x.com/zach_yadegari/status/2028473704359874652) · [Growthcurve 플레이북](https://growthcurve.co/three-engines-and-an-exit-the-cal-ai-growth-playbook) · [FunnelFox](https://blog.funnelfox.com/cal-ai-influencer-marketing/) · [eesel 가격](https://www.eesel.ai/blog/cal-ai-pricing) · [Nutrola 정확도](https://nutrola.app/en/blog/cal-ai-review-2026) · [TechCrunch 퇴출](https://techcrunch.com/2026/04/21/apples-cal-ai-crackdown-signals-its-still-policing-the-app-store/) · [MacRumors](https://www.macrumors.com/2026/04/21/apple-cal-ai-app-store-removal/) · [9to5Mac](https://9to5mac.com/2026/04/21/popular-calorie-tracker-briefly-pulled-from-app-store-over-iap-and-billing-violations/)

## 2. MyFitnessPal

- 세계 1위 영양 추적(2005~). 등록 2.2억, MAU 3,000만+. 매출 2024 $345M → 2025 $310M(-5.7%). Premium $19.99/월·$79.99/년(Meal Scan 사진 인식 = 유료), Premium+ $24.99/월. 2026: ChatGPT Health 연동, Intent 인수, **Cal AI 인수로 사진 AI·UGC 배포망 흡수.**
- **기록 포기 데이터**: 12주 RCT에서 일관 기록률 1주차 68% → 12주차 21%, 6개월 지속 ~23%. 사유: 입력 마찰, DB 불신, 죄책감, 사회적 식사.
- 출처: [MFP 요금](https://blog.myfitnesspal.com/myfitnesspal-membership-pricing-tiers/) · [Business of Apps](https://www.businessofapps.com/data/myfitnesspal-statistics/) · [Fitt Insider](https://insider.fitt.co/myfitnesspal-acquires-rival-food-tracker-cal-ai/) · [지속성 연구 PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9159560/)

## 3. Noom — 심리 코칭 + 최대 안전·신뢰 선례

- **구조**: CBT 포지셔닝 — 일일 심리 레슨 + 음식 신호등(초록/노랑/주황) + 코치 메시징(면허 없는 지원 인력, 2022 JMIR). 최근 GLP-1 처방(Noom Med $79~129/월)으로 축 이동.
- **가격**: 월간 ~$70, 연간 $209 선결제(~$17.4/월).
- **논란**: 2020-08 BBB 소비자 경고(취소 실패·선청구·환불 불가 수천 건) → **2022-02 자동갱신 기만 집단소송 $6,200만 합의**, 전직 엔지니어 "취소를 의도적으로 어렵게 설계" 증언. **섭식장애 비판**: 1,200kcal 일괄 배정, 신호등 분류가 음식 불안·죄책감 조장, ED 과거력 미스크리닝("현재 ED"만 질문) — "ED 없는 사람이 ED를 갖게 되는 관문" 비판.
- 출처: [ABC/BBB](https://abcnews.go.com/GMA/Wellness/business-bureau-warns-consumers-diet-app-noom-thousands/story?id=72457171) · [Wikipedia(합의)](https://en.wikipedia.org/wiki/Noom) · [Every "Dark Side of Noom"](https://every.to/glassy/the-dark-side-of-noom) · [Femestella](https://www.femestella.com/noom-reviews-horror-stories-eating-disorders/) · [Noom 가격](https://www.noom.com/blog/weight-management/noom-cost/)
- **시사점**: 심리 개입형 다이어트 앱의 양대 폭발 지점 = 결제 다크패턴 + ED 취약군 스크리닝 부재. 한입코치 PRD의 안전 설계는 이를 회피하나 **과거 ED 이력 스크리닝** 추가 권장.

## 4. Simple (simple.life)

- 단식 타이머 → **AI 코치 "Avo"** 중심 피벗. Avo Vision(사진 분석)·Avo Voice(음성 통화, 2025 말). 포지셔닝이 **"anti-discipline(반-규율)"** — 한입코치와 정반대 톤. 무료 티어(Avo 일 2회·스캔 일 1회) / 프리미엄 ~$49.99–59.99/년(퀴즈 변동가). 다운로드 2,000만+, **활성 구독 80만**.
- 출처: [simple.life](https://simple.life/) · [Avo Voice PR](https://www.prweb.com/releases/simple-launches-expands-on-its-anti-discipline-ai-coach-with-voice-calls-302652009.html) · [NutriScan 가격](https://nutriscan.app/blog/posts/simple-app-pricing-2026-free-vs-premium-coaching-20a26c6873)

## 5. Lose It! (Snap It)

- 사진 인식 선구(Snap It, 프리미엄 기능). 음식 카테고리 인식 ~70%, 양 추정 불안정. Premium $9.99/월·$39.99/년 — 카테고리 최저가권. 무료 티어 후함.
- 출처: [App Store](https://apps.apple.com/us/app/lose-it-calorie-counter/id297368629) · [Amy Food Journal](https://www.amyfoodjournal.com/blog/lose-it-app-review) · [NutriScan](https://nutriscan.app/blog/posts/lose-it-pricing-2026-free-vs-premium-2b4e921555)

## 6. "혼내는 코치" 포지션 선례

- **CARROT Fit (2014~, 원조)**: "Greetings, chubby human" 독설 + "7 Minutes in Hell". 유료 단품. CARROT 시리즈 누적 100만+ DL, 독설 캐릭터가 브랜드 자산화(CARROT Weather 히트). **단 ABC GMA "fat shaming" 비판 방송 + NEDA(미국 섭식장애협회)가 바디셰이밍 사례로 지목.** 출처: [Digital Trends](https://www.digitaltrends.com/phones/carrot-fit-app-review/) · [ABC](https://abcnews.go.com/GMA/video/carrot-fit-app-slammed-fat-shaming-22372990) · [Cult of Mac](https://www.cultofmac.com/news/sarcastic-ai-carrot-apps-brian-mueller)
- **Coach Sal (현행·최근접 경쟁)**: "Brutally honest personal trainer" — 식사 기록 시 즉시 **roast 또는 칭찬**. "No sugar-coating. No 'good try.'" **코칭 톤을 서포티브↔훈련조교 스펙트럼에서 사용자 선택**(핵심 설계). 지표 미확인. 출처: [getcoachsal.com](https://getcoachsal.com/)
- **Gymrat AI**: AI PT 앱이나 독설 포지션 여부 미확인. [App Store](https://apps.apple.com/us/app/gymrat-ai/id6455461607)
- **패턴**: 독설 톤은 (1) 바이럴·언론 노출에 강력 (2) 반드시 fat shaming 비판+ED 단체 지목이 따라옴 (3) 최신 제품들은 **강도 조절 옵션**으로 수렴 — PRD의 "차분하게/단호하게" 선택 설계와 일치.

## 7. 국내

- **인아웃 (마이노멀컴퍼니)**: 메모/사진 → AI 계량·영양 분석, AI 코치 "말랑 AI", 운동 DB·커뮤니티·게임화. 무료+프리미엄(평생 이용권 ~55% 특가 프로모션 중, 정상가 미확인). 유저 지표 미확인. 출처: [App Store](https://apps.apple.com/kr/app/id1599210729) · [inout.team](https://www.inout.team/)
- **필라이즈**: 초개인화 건강 슈퍼앱(식단·혈당·운동 13개+ 지표), 사진 "듀얼 AI" 분석, 무제한 AI 채팅. **플러스 월 15,900원**(할인 ~6,959원)·연 76,900원. **누적 150만 명, MAU 75만(14개월), 유료 재구독률 86%(자사), 시리즈A 120억.** 톤은 "다정한 AI 고냥이". "사진 매크로 앱 TOP5" SEO 콘텐츠 직접 운영 — 키워드 경쟁 개시. 출처: [서울경제](https://www.sedaily.com/NewsView/29TI94R7IN) · [AI타임스](https://www.aitimes.com/news/articleView.html?idxno=161035) · [pillyze.com](https://www.pillyze.com/)
- **다노 (마이다노→다노핏코치)**: 사람 코치 1:1 습관 코칭(2014~). **월 3만~10만원대**(토탈케어 6개월 기준 월 73,000원). 누적 수강 23만 건(7년). 최신 실적 미확인. 출처: [다노핏코치](https://dano.me/coach) · [EPNC](https://www.epnc.co.kr/news/articleView.html?idxno=218301) · [스타트업투데이](https://www.startuptoday.kr/news/articleView.html?idxno=28273)
  - **시사점**: 사람 코치 피드백의 국내 WTP = 월 3~10만원 검증 → AI로 이 가치를 월 1만원 미만에 주는 것이 한입코치 가격 논리.
- **눔코리아**: 한국 유저 500만(누적, 자사). 현재 알리안츠·건보공단·쿠팡케어 등 **B2B 중심 전환 정황**(2025-26 채용 0건). B2C 철수 공식 발표는 미확인. 출처: [잡플래닛](https://www.jobplanet.co.kr/companies/89218/landing/%EB%88%94%EC%BD%94%EB%A6%AC%EC%95%84) · [머니투데이](https://news.mt.co.kr/mtview.php?no=2023101906125882123)
- **다이어트신**: 100% 무료 다이어리+칼로리 사전+국내 최대 다이어트 커뮤니티. AI 사진 인식 없음. 수익은 다신샵 연계 추정(미확인). [App Store](https://apps.apple.com/kr/app/id981460948)
- **록시(Roxie, 미션핑거스)**: AI 러닝+헬스 하이브리드 코치, **식사 사진 → 칼로리·탄단지 자동 기록** 포함. 가격·지표 미확인. [roxie.pro/ko](https://www.roxie.pro/ko) · [App Store](https://apps.apple.com/us/app/roxie-ai-diet-workout-coach/id6749457282)
- **국내 사진-칼로리 롱테일**: SnapEat, Food Track(무료 표방), Kalori, Calsee, 다이어트AI, CalMind, 밀리그램 등 Cal AI 클론 다수 — "사진→칼로리"만으론 차별화 불가 신호. [Nutrola 한국어](https://nutrola.app/ko/blog/8-best-ai-nutrition-apps-2026)

## 8. 다이어트 앱 × 섭식장애 — 연구·기사 선례

1. **Levinson et al. 2017**: ED 환자 ~75%가 MFP 사용, 그중 **73%가 앱이 자기 ED에 기여했다고 인식**(증상 수준과 상관). [PMC5700836](https://pmc.ncbi.nlm.nih.gov/articles/PMC5700836/)
2. **BJPsych Open 2021 질적 연구**: 앱 UI(빨간 숫자 등)가 이분법적 사고를 강화해 ED 행동을 촉발·유지. [Cambridge](https://www.cambridge.org/core/journals/bjpsych-open/article/effects-of-diet-and-fitness-apps-on-eating-disorder-behaviours-qualitative-study/2D1EE739D97AB3EFC6573835E4C527BD)
3. **Flinders Univ. 2025 체계적 검토(38편)**: 건강·피트니스 앱 정기 사용자의 문제적 식사·운동 습관 가능성 높음. [Flinders](https://news.flinders.edu.au/blog/2025/02/22/fitness-apps-fuelling-disordered-eating/)
4. (반대 근거) 저위험군 RCT: ED 저위험 여대생 1개월 MFP 기록은 유의한 악영향 없음. [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2212267221007346)

**함의**: "단호한 피드백 + 칼로리 판정" 조합은 문헌이 지적하는 위험 기제(죄책감·이분법 판정)와 겹침. 온보딩 ED 스크리닝(과거력 포함), 톤 강도 선택(Coach Sal·Simple 방식), 체형 비하 절대 금지(CARROT/NEDA 선례)가 필수 안전장치.

## 미확인 항목

인아웃 유저 수·정상가 / 눔코리아 공식 철수 여부 / Coach Sal·록시·다이어트신 지표 / Gymrat AI 독설 여부 / 다노 최신 실적 / Cal AI 인수 금액(비공개, $100M설)
