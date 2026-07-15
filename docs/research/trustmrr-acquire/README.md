---
name: trustmrr-acquire--readme
description: TrustMRR 인수 마켓플레이스(trustmrr.com/acquire)를 로그인 무한스크롤로 전량 수집한 스타트업 1,863건(ideas.jsonl) 데이터셋 가이드 — 수집 방법·필드 정의·카테고리 분포·최고 매출/최저 희망가 시그널·PRD 후보 풀을 정리했다. 슬롯 카드덱 v5(134장)의 원천 데이터.
metadata:
  type: dataset
  topic: trustmrr-acquire
  category: readme
  date: 2026-07-05
---

# TrustMRR Acquire 아이디어 씨앗 데이터셋

## 한 줄 요약

**TrustMRR**은 만들어 놓은 스타트업·앱·서비스를 사고파는 온라인 장터다. 그중 "팝니다" 코너(`trustmrr.com/acquire`)에 올라온 매물 **1,863건을 통째로 긁어와 정리한 데이터**가 이 폴더다. 실제로 돈을 받고 팔리는(또는 팔려는) 제품들이라, **"사람들이 실제로 돈 내는 문제가 뭔가"를 보여 주는 시장 신호 모음**으로 쓴다.

## 왜 만들었나

우리 제품 **오늘 해볼까**의 슬롯 카드덱 v5(134장)를 이 데이터에서 뽑아 만들었다. 카드에 들어갈 "누가 / 어떤 고민을 / 어떤 방법으로" 같은 재료를, 상상으로 지어내지 않고 **실제 매물 1,863건에서 추려 온 것**이다. 앞으로 새 아이디어·PRD를 짤 때도 같은 방식으로 이 데이터를 다시 쓰면 된다.

## 먼저 알아 둘 용어

| 용어 | 뜻 |
| --- | --- |
| 매출(revenue) | 최근 30일 동안 그 제품이 번 돈 |
| 희망가(asking price) | 판매자가 "이 값에 팔고 싶다"고 적어 낸 금액 |
| 멀티플(multiple) | 희망가 ÷ 연 매출 환산치. 높을수록 비싸게 부른 것 |
| MVP 각도(mvp_angle) | "이걸 최소한으로 만든다면 어디부터?"를 한 줄로 적어 둔 메모 |
| JSONL | 한 줄에 레코드 하나씩 든 텍스트 파일. 도구가 읽기 편한 형식 |

상위 인덱스: [../INDEX.md](../INDEX.md) · 데이터셋 가이드: [../README.md](../README.md)
기계 판독용 카탈로그: [../MANIFEST.json](../MANIFEST.json)

## 수집 범위

- 수집 시각: `2026-07-05T06:47:55.876Z`
- 페이지에 표시된 결과 문구: `1863 startups found`
- 저장한 고유 스타트업 카드 수: `1863`
- 방법: 무한 스크롤 마켓플레이스를 모든 스타트업 링크가 DOM에 나타날 때까지 로드한 뒤, 카드 텍스트를 추출했다.
- 원본 캡처: `.firecrawl/trustmrr-acquire/browser-cards-all.json` (Git 추적 제외)

## 파일 구성

- [ideas.jsonl](ideas.jsonl) — **본체.** 한 줄에 매물 하나(총 1,863줄).
- [README.md](README.md) — 사람이 읽는 이 문서.
- [audits/](audits/) — 상위 100건이 제대로 수집됐는지 사람이 검수한 기록. 상세 페이지를 열어 고친 부분도 여기 있다.
- [translations/](translations/) — 상위 100건의 한국어 해설. **영어가 부담되면 여기부터 읽으면 된다.**
- [../store-rankings/app-store-expanded-unique-apps.jsonl](../store-rankings/app-store-expanded-unique-apps.jsonl) — 비교용 App Store 수요 데이터(다른 폴더).
- [../store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](../store-rankings/chrome-webstore-expanded-unique-extensions.jsonl) — 비교용 Chrome 웹스토어 수요 데이터(다른 폴더).

## 어디부터 열어 볼까 (AI 에이전트·사람 공통)

- 인수 시장 신호가 궁금하면 무조건 [ideas.jsonl](ideas.jsonl)부터 연다. 이 폴더의 본체다.
- "모바일 앱 쪽 수요는 어떤가?"를 비교하려면 [../store-rankings/app-store-expanded-unique-apps.jsonl](../store-rankings/app-store-expanded-unique-apps.jsonl)을 같이 본다.
- "브라우저 확장 프로그램 쪽은?"이라면 [../store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](../store-rankings/chrome-webstore-expanded-unique-extensions.jsonl)을 본다.
- `normalized_name`(이름을 소문자·공백 제거 등으로 다듬어 둔 값)은 **"같은 제품인가?" 후보를 좁힐 때만** 쓴다. 이름이 같아도 다른 제품일 수 있으니, 근거로 인용하기 전에 사람이 눈으로 한 번 확인한다.

## JSONL 한 줄에 들어 있는 필드

한 줄이 매물 하나다. 필드는 세 덩어리로 나뉜다.

- **신원**: `id`, `name`, `slug`, `url`, `category`, `raw_category_text`, `raw_description`
- **숫자(돈)**: `revenue_30d_text`, `revenue_30d_value`, `growth_30d_text`, `asking_price_text`, `asking_price_value`, `multiple_text`
  - `_text`는 화면에 보이던 문자열(`"$398k"`), `_value`는 계산에 쓰는 숫자(`398000`)다. **정렬·필터에는 `_value`를 쓴다.**
- **해석(우리가 붙인 것)**: `target_user`(누구를 위한 것인지), `problem`(어떤 문제를 푸는지), `current_alternative`(지금은 뭘로 대신하는지), `opportunity`(빈틈), `mvp_angle`, `tags`, `raw_card_text`(가공 전 원문)

## 카테고리 분포

전체 1,863건이 어떤 분야에 몰려 있는지. **AI가 485건으로 압도적**이고, SaaS·모바일 앱이 뒤를 잇는다. 뒤쪽의 `Stealth Venture`, `Private Enterprise` 같은 항목은 분야가 아니라 **판매자가 정체를 숨긴 매물**이라는 뜻이다.

- Artificial Intelligence: 485
- SaaS: 183
- Mobile Apps: 160
- Developer Tools: 106
- Productivity: 96
- Content Creation: 90
- Marketing: 88
- Education: 80
- Health & Fitness: 77
- Fintech: 46
- Design Tools: 45
- E-commerce: 44
- Uncategorized: 41
- Analytics: 39
- Social Media: 33
- Utilities: 33
- Entertainment: 30
- Games: 24
- Sales: 22
- Recruiting & HR: 22
- No-Code: 16
- Community: 12
- Real Estate: 11
- Travel: 10
- Marketplace: 9
- Customer Support: 9
- Security: 7
- News & Magazines: 7
- Stealth Company: 6
- Private Enterprise: 6
- Hidden Business: 6
- Confidential Startup: 5
- Stealth Venture: 5
- Private Venture: 3
- Crypto & Web3: 3
- Legal: 2
- Photo Sharing: 1
- IoT & Hardware: 1

## 최근 30일 매출 상위 20건 — "돈이 실제로 도는 곳"

이미 매출이 나오는 제품들이다. **"이 분야에 지갑을 여는 사람이 진짜 있다"는 증거**로 읽으면 된다. 다만 여기 있는 걸 그대로 따라 만들라는 뜻은 아니다.

- [1Lookup](https://trustmrr.com/startup/1lookup) — SaaS; 매출 $398k, 희망가 $10M, 멀티플 2.1x
- [S](https://trustmrr.com/startup/stealth-venture-15) — Stealth Venture; 매출 $125k, 희망가 $3M, 멀티플 2.0x
- [PROSP](https://trustmrr.com/startup/prosp) — Artificial Intelligence; 매출 $98k, 희망가 $1M, 멀티플 0.8x
- [Project A](https://trustmrr.com/startup/project-a) — Entertainment; 매출 $86k, 희망가 $5M, 멀티플 4.9x
- [Launch Club](https://trustmrr.com/startup/launch-club) — Marketing; 매출 $64k, 희망가 $3M, 멀티플 3.9x
- [GoTall](https://trustmrr.com/startup/gotall) — Health & Fitness; 매출 $57k, 희망가 $1M, 멀티플 1.5x
- [Mobile App](https://trustmrr.com/startup/mobile-app-4) — Mobile Apps; 매출 $52k, 희망가 $450k, 멀티플 0.7x
- [Doors Delivered](https://trustmrr.com/startup/doors-delivered) — E-commerce; 매출 $52k, 희망가 $650k, 멀티플 1.0x
- [P](https://trustmrr.com/startup/photo-sharing) — Photo Sharing; 매출 $50k, 희망가 $1.5M, 멀티플 2.5x
- [POST BRIDGE](https://trustmrr.com/startup/post-bridge) — Social Media; 매출 $43k, 희망가 $4.2M, 멀티플 8.2x
- [m](https://trustmrr.com/startup/mobile-app-5) — Uncategorized; 매출 $43k, 희망가 $950k, 멀티플 1.9x
- [SetSmart](https://trustmrr.com/startup/setsmart) — SaaS; 매출 $43k, 희망가 $499k, 멀티플 1.0x
- [Pushouse](https://trustmrr.com/startup/pushouse) — E-commerce; 매출 $40k, 희망가 $875k, 멀티플 1.8x
- [P](https://trustmrr.com/startup/private-enterprise-21) — Private Enterprise; 매출 $37k, 희망가 $1.5M, 멀티플 3.4x
- [imposter․ai](https://trustmrr.com/startup/imposter-ai) — Games; 매출 $36k, 희망가 $300k, 멀티플 0.7x
- [P](https://trustmrr.com/startup/hype-social-media-strategy) — Private Enterprise; 매출 $36k, 희망가 $1M, 멀티플 2.3x
- [Lunchbreak](https://trustmrr.com/startup/lunchbreak) — Education; 매출 $33k, 희망가 $1.5M, 멀티플 3.7x
- [Hyrox Fitness App](https://trustmrr.com/startup/hyrox-fitness-app) — Health & Fitness; 매출 $32k, 희망가 $3.8M, 멀티플 10.0x
- [Virlo](https://trustmrr.com/startup/virlo) — SaaS; 매출 $32k, 희망가 $1M, 멀티플 2.6x
- [Conductor](https://trustmrr.com/startup/conductor) — Developer Tools; 매출 $31k, 희망가 $1.3M, 멀티플 3.3x

## 희망가 최저 20건 — "만들었지만 안 팔린 것들"

$1~$100에 내놓은 매물들이다. 대부분 **매출 $0**이다. 즉 **"제품은 완성했는데 아무도 안 썼다"**는 실패 사례 모음이고, 그래서 오히려 **"이런 건 만들어도 안 팔리는구나"를 배우는 반면교사**로 쓴다.

- [AI Time Guardian](https://trustmrr.com/startup/ai-time-guardian) — SaaS; 희망가 $1, 매출 $0, 멀티플 -
- [BookChain](https://trustmrr.com/startup/bookchain) — Social Media; 희망가 $1, 매출 $0, 멀티플 -
- [60,000+ Weekly Users | 40,000+ daily Users | Chrome Extension | 3 Years Old | No Maintenance](https://trustmrr.com/startup/60-000-weekly-users-40-000-daily-users-chrome-extension-3-years-old-no-maintenance) — Productivity; 희망가 $1, 매출 $0, 멀티플 -
- [Blupry](https://trustmrr.com/startup/blupry) — Design Tools; 희망가 $10, 매출 $0, 멀티플 -
- [DutyClaw | OpenClaw MANAGED HOSTING](https://trustmrr.com/startup/dutyclaw-openclaw-managed-hosting) — Artificial Intelligence; 희망가 $49, 매출 $0, 멀티플 -
- [Pipeline Pro](https://trustmrr.com/startup/pipeline-pro) — Productivity; 희망가 $50, 매출 $0, 멀티플 -
- [beatthecrave](https://trustmrr.com/startup/beatthecrave) — Uncategorized; 희망가 $50, 매출 $0, 멀티플 -
- [ReadyToRelease](https://trustmrr.com/startup/readytorelease) — Artificial Intelligence; 희망가 $70, 매출 $0, 멀티플 -
- [NutriFriend](https://trustmrr.com/startup/nutrifriend) — Artificial Intelligence; 희망가 $70, 매출 $0, 멀티플 -
- [ReplyPack](https://trustmrr.com/startup/replypack) — Artificial Intelligence; 희망가 $75, 매출 $0, 멀티플 -
- [LiftMind](https://trustmrr.com/startup/liftmind) — Health & Fitness; 희망가 $80, 매출 $0, 멀티플 -
- [o](https://trustmrr.com/startup/onlyyes) — Uncategorized; 희망가 $99, 매출 $0, 멀티플 -
- [Exam Forge](https://trustmrr.com/startup/exam-forge) — Education; 희망가 $99, 매출 $0, 멀티플 -
- [Paylog](https://trustmrr.com/startup/paylog) — Fintech; 희망가 $99, 매출 $0, 멀티플 -
- [Notchclip](https://trustmrr.com/startup/notchclip) — Productivity; 희망가 $100, 매출 $4, 멀티플 1.9x
- [Dola](https://trustmrr.com/startup/dola) — Marketing; 희망가 $100, 매출 $7, 멀티플 1.2x
- [FluencyWave](https://trustmrr.com/startup/fluencywave) — Education; 희망가 $100, 매출 $0, 멀티플 -
- [Signo](https://trustmrr.com/startup/signo) — Marketing; 희망가 $100, 매출 $0, 멀티플 -
- [Pause - Habit & Urge Controller](https://trustmrr.com/startup/pause-habit-urge-controller) — Health & Fitness; 희망가 $100, 매출 $0, 멀티플 -
- [Christmas-AI-Studio](https://trustmrr.com/startup/christmas-ai-studio) — Design Tools; 희망가 $100, 매출 $0, 멀티플 -

## 빠른 PRD 후보 풀

PRD(제품 요구사항 문서)를 쓸 때 참고하려고, AI·크리에이터·개발자 도구·마케팅·세일즈·디자인·생산성·SaaS 영역에서 눈에 띄는 매물을 미리 골라 둔 목록이다.

> ⚠️ **아직 "이걸 만들자"는 추천이 아니다.** 그냥 나중에 찾기 쉽게 모아 둔 서랍이다. 설명은 원문 카드 텍스트(영어) 그대로 두었다.

- [Ploxto](https://trustmrr.com/startup/ploxto) — Artificial Intelligence; Ai Photo Editor App apified to Nanobana with more than 60M views on TikTok and +15K$ in revenue.
- [Backlinker AI](https://trustmrr.com/startup/backlinker-ai) — Marketing; Backlinker AI automates backlink acquisition through AI-powered reporter and editorial outreach. Built for agencies, founders, and SEO teams, it finds relevant ...
- [NextjobConnect LLC](https://trustmrr.com/startup/nextjobconnect-llc) — SaaS; Real-time job leads for home service contractors. Monitors neighborhood platforms, AI-classifies posts by trade, and alerts subscribers via iOS/Android app and ...
- [Roman AI](https://trustmrr.com/startup/roman-ai) — Artificial Intelligence; Roman is your AI coworker living in your Slack workspace and connecting to +3000 tools, skills and with persistent memory.
- [Atlas](https://trustmrr.com/startup/atlas) — Artificial Intelligence; Atlas is a personalized learning platform for students. Atlas's AI studies your class materials to help you nail your homework and ace your tests.
- [Fiddl.art](https://trustmrr.com/startup/fiddl-art) — Content Creation; Fiddl.art is a creative platform for high quality AI images and videos using models like Nano Banana Pro, Flux 2 and Sora. Magic Mirror gives fast guided result...
- [AIRIX - AEO / AI Visibility Platform](https://trustmrr.com/startup/airix-aeo-ai-visibility-platform) — Artificial Intelligence; AIRIX is an AI visibility SaaS with a paid Growth dashboard for businesses that want to be recommended by ChatGPT, Claude, Gemini and other AI answer engines. I...
- [SceneRoll](https://trustmrr.com/startup/sceneroll) — Content Creation; A better way to edit short-form faceless video. No editor timeline, no audio scrubber. Just upload audio, add your B-roll, and our app does the rest!
- [CarMaster](https://trustmrr.com/startup/carmaster) — SaaS; Music mastering SaaS uniquely positioned to focus on making rappers' songs sound good in the car. In addition to B2C, we have multiple B2B customers who whitela...
- [Linkeddit](https://trustmrr.com/startup/linkeddit) — Sales; An AI-powered all-in-one Reddit marketing platform that helps founders find customers who are already on Reddit asking for what they sell.
- [The Swift Kit](https://trustmrr.com/startup/the-swift-kit) — Developer Tools; The best SwiftUI boilerplate for indie iOS developers. Clone the repo, paste your API keys, and ship a production‑ready app with onboarding, paywalls, Supabase ...
- [VoiceType.com](https://trustmrr.com/startup/voicetype-com) — Artificial Intelligence; VoiceType is an AI-driven voice dictation software designed to increase productivity by replacing typing with speech. We charge customers during checkout.
- [LeadFind](https://trustmrr.com/startup/leadfind) — Sales; Type in the leads you need, LeadFind does the rest. Our LeadFind AI does research your request and sets up a Lead Find campagne and start sending cold emails on...
- [AI Text Humanizer](https://trustmrr.com/startup/ai-text-humanizer-1) — Artificial Intelligence; Profitable AI text humanizer built for an underserved European academic market with limited local competition. Helps students turn rough or AI-generated writing...
- [AceFace](https://trustmrr.com/startup/aceface) — SaaS; AceFace.app generates ultra-realistic AI business portraits to help people standout on social media such as LinkedIn as well as in their resume/CVs, team pages,...
- [constructor](https://trustmrr.com/startup/constructor) — Artificial Intelligence; Generate estimates in minutes with a user-friendly interface, reducing friction and boosting confidence with AI-enhanced accuracy.
- [Reppit AI - Reddit Marketing Tool](https://trustmrr.com/startup/reppit-ai-reddit-marketing-tool) — SaaS; Reddit Marketing Tool to promote your product - AI Finds and scores relevant posts about your niche where you can reply to mention your product. We find Reddit ...
- [Whitelabel AI Assistants Builder - Huge Opportunity - 98% Margin - $250K](https://trustmrr.com/startup/whitelabel-ai-assistants-builder-huge-opportunity-98-margin-250k) — Artificial Intelligence; White-label AI assistant builder for agencies and SMBs. Customers use it to turn website content into branded AI assistants that answer questions, capture leads...
- [Contentbase](https://trustmrr.com/startup/contentbase) — Artificial Intelligence; Grow organic & AI traffic on autopilot
- [CORSPROXY](https://trustmrr.com/startup/corsproxy) — SaaS; Fix every CORS Error in Seconds! Trusted by Uniswap and other large Companies around the World.
- [Synta](https://trustmrr.com/startup/synta) — SaaS; A premium model context protocol (MCP) server and web app designed to turn AI clients like Claude, Cursor, and OpenClaw into expert n8n workflow architects, wit...
- [Elofoot](https://trustmrr.com/startup/elofoot) — Artificial Intelligence; Elofoot is an AI-powered football prediction platform that forecasts match outcomes, exact scores and scorers with market-leading accuracy. Built for the 2026 W...
- [Mobiclaw](https://trustmrr.com/startup/mobiclaw) — Artificial Intelligence; Openclaw for mobile
- [ChurchCalls.ai](https://trustmrr.com/startup/churchcalls-ai) — Artificial Intelligence; ChurchCalls.ai empowers your church or ministry with an AI assistant that answers calls, gathers info, and bridges seamlessly to a live person—24/7. With our la...
- [Blogmaker](https://trustmrr.com/startup/blogmaker) — Content Creation; BlogMaker is a no–code blogging platform through which business customers can create their blog and publish SEO articles.
- [Efferd](https://trustmrr.com/startup/efferd) — Developer Tools; Save hours of design time with clean, ready-to-use shadcn blocks that just work — modern, responsive, and built for speed.
- [Documind Ltd](https://trustmrr.com/startup/documind-ltd) — Artificial Intelligence; A tool that uses AI to chat and interact with PDFs.
- [QuizGPT](https://trustmrr.com/startup/quizgpt) — Artificial Intelligence; QuizGPT provides AI-powered quiz assistance for Kahoot through a Chrome extension. Customers are charged immediately at checkout for monthly access to two subsc...
- [Word Spinner](https://trustmrr.com/startup/word-spinner) — Productivity; AI-powered content rewriting and humanization platform. Chrome Extension, AI detector bypass, AI Humanizer, writing templates and more. Est 2022.
- [RareRoles](https://trustmrr.com/startup/rareroles) — SaaS; Remote jobs not found on LinkedIn or Indeed
- [ColdSire](https://trustmrr.com/startup/coldsire) — SaaS; We help businesses scale outreach with premium cold email inboxes.
- [Leadbomb](https://trustmrr.com/startup/leadbomb) — SaaS; Leadbomb.io is a lead generation platform that pulls business and audience data from across the web such as Google Maps, LinkedIn, Instagram, Shopify, and Yelp ...
- [widgetly](https://trustmrr.com/startup/widgetly) — Productivity; Widgetly provides ready-to-use widgets to enhance Notion pages for businesses and freelancers.
- [Seating Hero](https://trustmrr.com/startup/seating-hero) — SaaS; Seating Planner for any event: weddings, receptions, organizations.
- [Ai Editor: Photo & Video](https://trustmrr.com/startup/ai-editor-photo-video) — Artificial Intelligence; Kling 3.0, Motion Control, and Seedance have been deactivated. They can be activated at any time. An all-in-one AI studio application developed from scratch wit...
- [Chariot AI](https://trustmrr.com/startup/chariot-ai) — Artificial Intelligence; Create a website in minutes. Made for small businesses and non-technical users.
- [Sleek Analytics](https://trustmrr.com/startup/sleek-analytics) — Developer Tools; A simple Google Analytics alternative that tells you what actually matters
- [Rumora](https://trustmrr.com/startup/rumora) — Marketing; 50,000 AI agents mentioning your brand in relevant TikTok and YouTube videos before they go viral. They autonomously perform thousands of searches per day, anal...
- [StriGrow](https://trustmrr.com/startup/strigrow) — Artificial Intelligence; Your website is ready in 60 seconds Type what your business does. AI builds a complete, professional website instantly. Free to try — no credit card needed. Cur...
- [findmeidea.com](https://trustmrr.com/startup/findmeidea-com) — SaaS; SaaS subscription platform that helps entrepreneurs and indie founders discover validated business ideas. Users pay a monthly subscription to access a database ...

## 쓸 때 지킬 것

- **베끼기용 명세가 아니다.** 각 줄은 "이런 문제에 돈을 내는 사람이 있었다"는 신호일 뿐, 그대로 복제할 제품 설계도가 아니다.
- **거를 때는 네 가지 축으로**: 카테고리 → 매출 → 희망가 → MVP 각도. 이 순서로 좁히면 후보가 빨리 준다.
- **설명이 `...`으로 잘려 있는 건 원본 사이트 UI 탓이다.** 우리가 자른 게 아니다. 정말 후보로 좁혀진 몇 건만 상세 페이지(`url`)를 열어 확인한다. 1,863건을 다 열지 말 것.
- `raw_category_text`는 **카드에 실제로 찍혀 있던 원문 한 줄**이고, `category`는 그걸 **마켓플레이스의 공식 카테고리로 맞춰 정리한 값**이다. 원문이 궁금하면 앞엣것, 집계·필터에는 뒤엣것을 쓴다.
