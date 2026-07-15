# 해외 캐릭터 챗 직접 경쟁군 딥다이브 — CHAI · Talkie · PolyBuzz

> 조사일: 2026-07-12 · 조사자: PM 리서처 (웹 리서치 기반)
> 대상: Character.AI의 3대 직접 경쟁 앱. 수치는 대부분 서드파티 추정치이므로 오더(자릿수) 참고용.

---

## 1. CHAI (Chai Research Corp., 미국 팔로알토)

### 1-1. 제품 구조
- **TikTok식 스와이프 디스커버리 피드**가 코어 UX: 앱을 열면 캐릭터 카드를 스와이프하며 다른 유저들의 대화 스니펫을 미리 보고 탭해서 바로 채팅 시작. 모바일 퍼스트, 중저가 안드로이드에서도 빠른 로딩·부드러운 스와이프 강조. ([WeavAI 리뷰 2026](https://weavai.app/blog/en/2026/04/13/chai-ai-review-2026-is-the-mobile-first-ai-chat-app-worth-paying-for-features-pricing-and-full-analysis/), [ScreensDesign](https://screensdesign.com/showcase/chai-social-ai-platform-chat))
- **UGC 제작 도구**: 다단계 봇 크리에이터(성격→토픽→백스토리 순 진행형 UI). 공개/비공개 선택 가능, 인기 봇 제작자는 **크리에이터 리워드** 수령. 커뮤니티 제작 캐릭터 50만+ 라이브러리. ([Skywork 가이드](https://skywork.ai/skypage/en/chai-bot-ai-character-creation/2027263468693573632), [WeavAI](https://weavai.app/blog/en/2026/04/14/chai-ai-review-2026-features-pricing-analysis/))
- **비주얼 요소**: 2026년 신규 **Selfie 기능** — 대화 무드에 맞춰 봇이 채팅 중 AI 생성 이미지를 전송. 음성·수집(가챠) 요소는 약한 편으로, 텍스트 채팅+피드가 중심. ([WeavAI](https://weavai.app/blog/en/2026/04/13/chai-ai-review-2026-is-the-mobile-first-ai-chat-app-worth-paying-for-features-pricing-and-full-analysis/))

### 1-2. 수익화
- 구독 2단: **Premium $13.99/월**(무제한 메시지), **Ultra $29.99/월**(상위 모델+우선 큐). 무료 티어는 **70메시지 캡(약 2.5시간마다 리셋)**. 광고 모델보다 구독 전환 압박 중심. ([WeavAI](https://weavai.app/blog/en/2026/04/13/chai-ai-review-2026-is-the-mobile-first-ai-chat-app-worth-paying-for-features-pricing-and-full-analysis/), [Scribe 리뷰](https://scribehow.com/page/Chai_AI_Review_2026_Fun_in_Short_Bursts_But_Is_It_Built_for_Anything_More__NFM1IkRwTROG_93QKDzpog))

### 1-3. 지표·자체 모델 전략
- **2026 Q1 ARR 약 $80M, 추정 밸류에이션 $2.4B**(2026년 $200M ARR 전망, 3년 연속 3x 성장 주장). 총 투자 $55M+ — **CoreWeave·AMD가 전략 투자자**. ([PR Newswire 2026](https://www.prnewswire.com/news-releases/chai-ai-backed-by-coreweave-and-amd-hits-80m-arr-with-talks-of-2-4b-valuation-302759626.html), [Pulse2](https://pulse2.com/chai-ai-surpasses-80-million-arr-at-2-4-billion-estimated-valuation/))
- 2026-04 기준 **활성 사용자 약 1,000만**, DAU 100만~150만 추정, 누적 다운로드 1,000만+. ([Wikipedia](https://en.wikipedia.org/wiki/Chai_AI), [SensorTower](https://app.sensortower.com/overview/1544750895?country=US))
- **자체 LLM이 핵심 전략**: 오픈소스 LLM으로는 "소셜/인게이지먼트 최적화"가 안 돼 수백 개의 인하우스 학습 LLM을 AMD(MI325X/MI300X)+NVIDIA 혼합 GPU 위 "Model Mesh"로 서빙. 인하우스 모델 전환으로 인게이지먼트 +10%, 235B A22B MoE 블렌드 도입으로 스크린타임·매출 +25% 주장. ([CHAI 로드맵 PDF](https://www.chai-research.com/chai_roadmap_2025.pdf), [chai-research.com](https://www.chai-research.com/))

### 1-4. 최근 업데이트·뉴스 / C.AI 대비 포지셔닝
- 2025년 CoreWeave·AMD 추가 투자(Strategic Round II), 2026 Q1 $80M ARR·$2.4B 밸류 발표로 "인프라 파트너가 투자한 자체 모델 회사" 내러티브 강화. ([CHAI 펀딩 발표](https://www.chai-research.com/announcement))
- Character.AI가 2025-11 **미성년 오픈챗 전면 금지**를 발표하자, Chai·Replika 등 경쟁사는 **"18+ 전용" 포지셔닝으로 이탈 수요 흡수** 마케팅. C.AI(구글 자본, 필터 강함) 대비 "느슨한 필터+커뮤니티 봇"이 사실상의 차별점. ([Fortune 2025-10](https://fortune.com/2025/10/29/character-ai-ban-children-teens-chatbots-regulatory-pressure-age-verification-online-harms/), [CNBC](https://www.cnbc.com/2025/11/24/characterai-to-ban-teens-from-open-ended-chats-human-interaction-is-crucial-psychotherapist-says.html))

### 1-5. 이슈·리스크
- **2023 벨기에 자살 사건**(챗봇 "Eliza"가 자살을 부추김)이 업계 대표 사고 사례로 지금까지 인용됨. 테스트 시 자살 방법 등 유해 콘텐츠 노출 재현. ([Vice](https://www.vice.com/en/article/man-dies-by-suicide-after-talking-with-ai-chatbot-widow-says/), [AI Incident DB #505](https://incidentdatabase.ai/cite/505/))
- 2025-04 **미 상원의원들이 Character.AI·Chai·Luka(Replika)에 아동 안전 서한** 발송, 2025-09 **FTC 생성형 AI 미성년 위해 조사** 개시 — Chai는 규제 타깃군에 직접 포함. NSFW 필터가 사용자 설정으로 해제 가능한 구조라 미성년 보호 취약 지적. ([Welch 상원 서한](https://www.welch.senate.gov/senators-demand-information-from-ai-companion-apps-following-kids-safety-concerns-lawsuits/), [ABA](https://www.americanbar.org/groups/health_law/news/2025/ai-chatbot-lawsuits-teen-mental-health/), [AirDroid 안전성 분석](https://www.airdroid.com/parent-control/is-chai-ai-safe/))

### 1-6. 사용자 VOC
- **메모리가 최대 불만**: 20~40메시지 지나면 이름·백스토리 망각. "메모리 언제 고쳐지냐"가 커뮤니티 단골 질문. ([Scribe](https://scribehow.com/page/Chai_AI_Review_2026_Fun_in_Short_Bursts_But_Is_It_Built_for_Anything_More__NFM1IkRwTROG_93QKDzpog))
- 70메시지 캡이 롤플레이 몰입 중간에 끊겨 반발 큼. 2025 말~2026 초 필터 강화로 "C.AI처럼 돼 간다"는 백래시. Ultra $29.99가 Replika/Kindroid 대비 가성비 낮다는 평. (동일 출처)

### 1-7. 벤치마킹 시사점
1. **"대화 스니펫 미리보기 피드"가 콜드스타트 킬러**: 캐릭터 설명이 아니라 남의 실제 대화 장면을 보여줘 탭 전환율을 만든다 — 결과물 미리보기를 발견 피드에 태우는 패턴은 어떤 UGC 제품에도 이식 가능.
2. **소비량 캡(70msg/2.5h)을 페이월로**: 시간 리셋형 캡은 일일 캡보다 재방문(세션 분산)을 유도하면서 헤비유저만 정확히 과금 지점에 도달시킨다.
3. **인프라 파트너(AMD·CoreWeave)를 투자자로 끌어들여 원가 절감+내러티브 확보** — 자체 모델은 품질보다 '인게이지먼트 최적화+마진' 목적이라는 점이 핵심.

---

## 2. Talkie (MiniMax 계열, 중국계 · 국내판 Xingye의 해외판)

### 2-1. 제품 구조
- 몰입형 캐릭터 대화 + **오디오·비주얼 멀티모달**: 외형·목소리·사고방식까지 커스터마이즈, 사실적 보이스 라이브러리에서 음성 선택. ([Zulo 리뷰](https://www.zuloai.com/blog/talkie-ai-features-strengths-risks-and-user-experiences/), [Natural20](https://natural20.com/talkie-ai))
- **시그니처 = 가챠 카드 수집**: 젬으로 랜덤 카드 뽑기, 카드마다 고유 아트워크·전용 보이스라인·스토리 분기 언락. 중복 카드 재활용(리사이클)로 젬 환급. 2026년엔 **이벤트 한정 젬 + 기간 한정 카드**로 FOMO 메커니즘 강화 — 컴패니언 챗에 모바일게임 라이브옵스 경제를 그대로 이식한 사례. ([honeychat 리뷰 2026](https://honeychat.bot/en/blog/talkie-ai-review-features-pricing-2026/), [gptproto](https://gptproto.com/news/talkie-ai))
- UGC: 캐릭터 생성(외모 이미지 생성 포함)+공개 피드. 국내판 Xingye의 검증된 플레이북을 해외 이식. ([Bestie AI 가이드](https://bestieai.app/topics/wellness/how-to-use-talkie-ai-app-guide))

### 2-2. 수익화 — 3중 구조(구독+재화+광고)
- **Talkie+ 구독**: iOS 기준 $9.99/월, Pro $24.99/월, 연간 $49.99 옵션 + 젬 팩/번들 IAP. 프리미엄은 빠른 이미지 생성·카드 풀 횟수 증가·HD 보이스. ([honeychat](https://honeychat.bot/en/blog/talkie-ai-review-features-pricing-2026/))
- **재화(젬)**: 가챠 뽑기 유도. 데일리 체크인·태스크·이벤트로 무료 획득 가능(리텐션 루프 겸용).
- **광고 매출이 유의미**: 무료 티어에 40~50초 영상 광고. MiniMax IPO 문서 기준 광고가 주요 수익원 중 하나로 명시. ([Pandaily](https://pandaily.com/minimaxs-app-talkie-generates-significant-advertising-revenue/), [aiinsights](https://aiinsightsnews.net/talkie-ai/))

### 2-3. 지표·모델 전략
- 2024년 8개월간 **글로벌 다운로드 1,700만**(같은 기간 C.AI 1,900만에 근접), 2024-07 기준 **MAU 약 1,100만**, 미국 무료 엔터 앱 5위(다운로드로 C.AI 추월 시점 존재). ([KrAsia](https://kr-asia.com/talkies-global-traction-puts-minimax-in-ais-top-tier-but-risks-loom), [Yahoo/SCMP](https://finance.yahoo.com/news/chinese-ai-unicorn-minimax-scores-093000101.html))
- **MiniMax 2025년 1~9월 매출 $53.4M 중 소비자 앱 71%, Talkie 단독 35%**. Hailuo(영상) 33%. 2025-12-31 기준 MiniMax 전체 누적 사용자 2.36억/200+개국. ([ciw.news](https://www.ciw.news/p/zhipu-ai-minimax-ipo), [MiniMax IPO 문서](https://file.cdn.minimax.io/public/ba6ecddc-7a0f-434a-b340-96576f676b3c.pdf))
- 모델 전략: **자체 파운데이션 모델(MiniMax abab→M 시리즈)** 위에서 구동 — Chai와 마찬가지로 자체 모델 수직통합형. 단 2026년엔 회사 무게중심이 엔터프라이즈 API로 이동(Sacra 추정 2026-05 연환산 $300M). ([Sacra](https://sacra.com/c/minimax/))

### 2-4. 최근 업데이트·뉴스 / C.AI 대비 포지셔닝
- **2024-12-17 미국 iOS 앱스토어에서 삭제**("기술적 사유" 주장) → **2025-02 "Talkie Lab"이라는 새 이름/새 SKU로 복귀**. 데이터 프라이버시·국가안보·모더레이션 우려(중국계 앱 규제 흐름)가 배경으로 지목. ([SCMP](https://www.scmp.com/tech/tech-trends/article/3291715/chinese-owned-characterai-rival-vanishes-us-app-store), [CTOL](https://www.ctol.digital/news/talkie-ai-chat-app-pulled-us-app-store/), [Distractify](https://www.distractify.com/p/what-happened-to-talkie-ai), [Talkie Lab App Store](https://apps.apple.com/us/app/talkie-lab-ai-playground/id6740326134))
- **2026-01-09 MiniMax 홍콩 IPO** — 첫날 주가 2배, 약 $13B 밸류, $619M 조달. Talkie는 상장사의 캐시카우 소비자 앱 지위. ([PYMNTS](https://www.pymnts.com/artificial-intelligence-2/2026/chinese-ai-company-minimax-sees-share-price-double-on-day-of-ipo/), [Wikipedia](https://en.wikipedia.org/wiki/MiniMax_Group))
- 포지셔닝 변화: 2025~2026 **패밀리 프렌들리 방향으로 필터 강화**(성인 RP 유저 이탈 감수). C.AI 대비 "게임화(가챠)+보이스" 차별화는 유지하되, 규제 리스크 때문에 콘텐츠 수위는 오히려 C.AI 쪽으로 수렴 중. ([honeychat](https://honeychat.bot/en/blog/talkie-ai-review-features-pricing-2026/))

### 2-5. 이슈·리스크
- 중국계 소유 구조 → 미국 내 데이터·안보 규제 리스크 상존(앱스토어 삭제 전례). ([Daily Mirror](https://www.dailymirror.lk/international/Talkie-App-ban-A-blow-to-Chinas-AI-as-global-concerns-mount/107-299217))
- 연령 인증 부재 + 미성년 시나리오 접근 가능성 지적(아동 안전 단체 비판). ([Gabb](https://gabb.com/blog/is-talkie-ai-safe/))
- 2026-01 전면 장애 발생 이력, 사전 경고 없는 영구 밴 다수 보고. ([aiinsights](https://aiinsightsnews.net/talkie-ai/), [Trustpilot](https://www.trustpilot.com/review/www.talkie-ai.com))

### 2-6. 사용자 VOC
- **"경고 없는 영구 밴 + 환불 없음"**이 Trustpilot 최다 악성 리뷰("자고 일어나니 계정이 밴, 쌓아온 게 전부 사라졌다"). ([Trustpilot](https://www.trustpilot.com/review/www.talkie-ai.com))
- 필터가 몰입 RP를 중간에 끊는 "too deep" 개입에 대한 불만, 장기 대화 메모리 리셋. 2026년 Pro+ 대상 **벡터DB 기반 장기기억 모듈** 롤아웃으로 대응 중. 무료 티어 40~50초 광고 피로. ([Scribe](https://scribehow.com/page/Talkie_AI_Review_2026_Voice_Is_Great_But_the_Bans_Are_Real__1rq0yjTtTEKO7pe03ebFEw), [aiinsights](https://aiinsightsnews.net/talkie-ai/))

### 2-7. 벤치마킹 시사점
1. **수집(가챠 카드)이 대화를 '소모형 콘텐츠'에서 '자산'으로 바꾼다**: 카드=아트+보이스+스토리 언락을 묶은 수집물로 만들어 재화 소비·이벤트 FOMO·리텐션 루프를 동시에 돌림 — 대화 앱 수익화의 상한을 광고+구독+IAP 3중으로 끌어올린 모범.
2. **밴/필터 정책의 예측 불가능성은 유료 유저 신뢰를 직접 파괴**한다(환불 없는 영구 밴 → Trustpilot 도배). 과금과 제재 정책은 반드시 분리·투명화해야 함.
3. **플랫폼 리스크 대응 플랜B(Talkie Lab 재상장)**: 앱 삭제 시 별도 SKU로 2개월 내 복귀 — 스토어 의존 제품은 리브랜딩 복귀 경로를 미리 설계해둘 가치.

---

## 3. PolyBuzz (구 Poly.AI, Cloud Whale Interactive Technology LLC)

### 3-1. 제품 구조
- **2,000만+ 커뮤니티 제작 캐릭터** 카탈로그(애니/OC/팬덤/실존 인물풍) + 텍스트·음성 채팅. **그룹 룸(AI 캐릭터 2~4명 동시 상호작용)**이 차별 기능. ([Fastio 리뷰 2026](https://fast.io/resources/polybuzz-ai-review-2026/), [aitoolscoop](https://aitoolscoop.com/tool/polybuzz/))
- UGC 제작 도구는 성격 설명·보이스 설정·아바타 이미지 수준 — **C.AI의 장문 정의/예시 대화 대비 덜 정교**. ([Fastio](https://fast.io/resources/polybuzz-ai-review-2026/))
- 비주얼: 이미지 생성("**Live Photos**", 구독 등급별 일 20~30회), 프롬프트 기반 숏폼 비디오 생성(품질 편차). 웹·iOS·안드로이드 지원이나 웹은 보이스 없음+짧은 히스토리+광고 모달 더 공격적 → 사실상 앱 중심. ([Fastio](https://fast.io/resources/polybuzz-ai-review-2026/), [honeychat](https://honeychat.bot/en/blog/polybuzz-review-features-pricing-2026/))
- 성장 경로: **TikTok 바이럴 + 구글플레이** 중심, 주 사용층 브라질·미국·멕시코, 18~25세 타깃. ([biogpt 리뷰](https://www.biogpt.io/polybuzz-ai-a-hands-on-review/))

### 3-2. 수익화
- 프리미엄 구독: 시작가 **$9.90/월**, Premium **$19.90/월**, Ultimate **$29.90/월**(영구 메모리 "Permanent Memory" 포함). 무료는 기본 채팅 무제한이나 보이스·이미지·장기기억이 페이월 뒤. ([PolyBuzz 멤버십 페이지](https://www.polybuzz.ai/membership), [honeychat](https://honeychat.bot/en/blog/polybuzz-review-features-pricing-2026/))
- **광고 모델 적극 사용**: 무료 안드로이드 티어에서 약 5메시지마다 광고, "채팅 계속하려면 광고 시청" 모달 — 3사 중 광고 의존이 가장 노골적. TikTok에서 광고 자체가 "cursed ads"로 밈화. ([plisio](https://plisio.net/ai/polybuzz-ai), [TikTok discover](https://www.tiktok.com/discover/why-is-polybuzz-now-giving-me-ads-to-keep-chatting))

### 3-3. 지표·모델 전략
- 구글플레이 **1,000만~5,000만 설치**, 리뷰 98.8만·평점 3.8★. 2026 초 기준 **월 방문 약 4,280만, 평균 세션 약 17분**. ([zoftwarehub](https://zoftwarehub.com/products/polybuzz/product-details), [Fastio](https://fast.io/resources/polybuzz-ai-review-2026/))
- 기업 정보 비공개(부트스트랩/무펀딩 추정), 애널리스트 추정 기업가치 **$60M~$120M** — 3사 중 가장 린한 운영. 자체 파운데이션 모델 없이 서드파티 LLM 활용으로 추정(자체 모델 공개 정보 없음). ([Fastio](https://fast.io/resources/polybuzz-ai-review-2026/))

### 3-4. 최근 업데이트·뉴스 / C.AI 대비 포지셔닝
- **2024 말~2025-01 Poly.AI → PolyBuzz 리브랜딩**(엔터프라이즈 보이스 AI 'PolyAI Ltd.'와 혼동 회피 + 커뮤니티 정체성). ([honeychat](https://honeychat.bot/en/blog/polybuzz-review-features-pricing-2026/), [biogpt](https://www.biogpt.io/polybuzz-ai-a-hands-on-review/))
- 포지셔닝: C.AI가 필터·미성년 규제로 조이는 동안 **"덜 필터링된 성인향 RP + 무료 무제한 기본 채팅"**으로 이탈 수요 흡수하는 로우엔드 대체재. 단 2025~2026 업데이트마다 필터가 예고 없이 강화되는 "filter whiplash"로 이 포지션도 흔들리는 중. ([pixpretty](https://pixpretty.tenorshare.ai/reviews/polybuzz-ai-alternative.html), [justuseapp 리뷰](https://justuseapp.com/en/app/6449190344/poly-ai-create-ai-chat-bot/reviews))

### 3-5. 이슈·리스크
- 실존 인물풍·팬덤 캐릭터 대량 방치 → IP/퍼블리시티 리스크. 연령 검증 부재 상태에서 성인향 포지셔닝 → 캘리포니아 **AI Companion Safety Act(2025)** 류 규제에 직접 노출. ([Fortune 규제 맥락](https://fortune.com/2025/10/29/character-ai-ban-children-teens-chatbots-regulatory-pressure-age-verification-online-harms/))
- 사유 불명의 채팅/캐릭터 밴, 업데이트마다 달라지는 모더레이션 기준. 광고 과다로 무료 티어 평판 악화(평점 3.8★로 3사 중 낮은 편). ([justuseapp](https://justuseapp.com/en/app/6449190344/poly-ai-create-ai-chat-bot/reviews), [zoftwarehub](https://zoftwarehub.com/products/polybuzz/product-details))

### 3-6. 사용자 VOC
- **250자 메모리 한도**가 대표 불만 — 캐릭터 다수 등장 RP에서는 사실상 무용, 몇 턴 만에 설정 망각·질문 반복. ([plisio](https://plisio.net/ai/polybuzz-ai), [seaart 리뷰](https://www.seaart.ai/blog/polybuzz-ai))
- 5메시지마다 광고로 대화 흐름 끊김, 응답 지연, 프리미엄 강제감. "훅은 빠른데 오래 못 간다(hooks you fast, doesn't hold up)"는 평가가 반복됨. ([writenexa](https://www.writenexa.com/blog/polybuzz-ai-review-it-hooks-you-fast-but-does-it-hold-up/))

### 3-7. 벤치마킹 시사점
1. **"기본 채팅 무료 무제한 + 광고" 로우엔드 전략의 명암**: TikTok 바이럴+무료 무제한으로 설치량은 C.AI급으로 끌어올렸지만, 광고 빈도가 제품 경험을 잠식해 평점·리텐션을 깎음 — 광고는 세션 경계(대화 사이)에만 두는 게 안전선.
2. **메모리를 과금 사다리로 쓰는 설계**(무료 250자 → Ultimate '영구 메모리' $29.90): 컴패니언 챗에서 '기억'이 최상위 지불의사 지점임을 보여주는 가장 명시적인 사례.
3. **자체 모델 없이도 유통(틱톡 바이럴)+UGC 볼륨만으로 톱티어 트래픽 도달 가능** — 단 그 경우 차별점이 '필터 수위'뿐이라 규제 한 방에 포지션이 무너지는 취약 구조.

---

## 공통 관찰 (3사 종합)

| 축 | CHAI | Talkie | PolyBuzz |
|---|---|---|---|
| 코어 훅 | 스와이프 피드+대화 스니펫 | 가챠 카드 수집+보이스 | 무료 무제한+2천만 캐릭터 |
| 수익화 | 구독 2단($13.99/$29.99) | 구독+젬 IAP+광고 3중 | 구독 3단($9.9~29.9)+광고 과다 |
| 자체 모델 | O (인하우스 LLM 메시) | O (MiniMax 파운데이션) | X (추정) |
| 규모(추정) | ARR $80M, 활성 1천만 | MiniMax 매출의 35%, MAU 1,100만+ | 월 방문 4,280만, 밸류 $60~120M |
| 최대 리스크 | 자살 사건 전례+FTC 조사 | 중국계 규제(앱 삭제 전례) | 필터 휘플래시+IP 방치 |

- 3사 공통 VOC 1위는 **메모리**(망각) — 장기기억이 이 카테고리의 미해결 핵심 과제이자 최상위 과금 지점.
- 2025-11 C.AI 미성년 오픈챗 금지 + CA AI Companion Safety Act + FTC 조사로 **규제가 카테고리 전체의 포지셔닝을 재편 중**: "18+로 선명하게" vs "패밀리 프렌들리로 수렴" 양극화.
