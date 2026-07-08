---
name: gas-app--voc-safety-reviews
description: Gas 앱스토어 리뷰 감정분석(또래 연결 호평 vs 가짜 칭찬 의심·신원검증 부재 불만), 10대 안전성 논란(2022-10 인신매매 괴담과 실제 경찰·학교 개입, 코넬대·CBC 전문가의 사회비교/불안 화폐화 비판), Discord의 실제 종료 사유(내부 메모 기반 엔지니어링 팀 확보용 acqui-hire), NGL·Sendit FTC 규제 사례를 정리한 VOC·안전성 문서.
metadata:
  type: research
  topic: gas-app
  category: voc
  date: 2026-07-08
---

# Gas 앱 VOC 및 안전성/규제 이슈

> 리서치 목적: "오늘 해볼까"의 익명 투표 기능 설계 시 참고할 리스크 사전 파악.
> 조사일: 2026-07-08. Gas 앱은 2023-11-07 서비스 종료되어 앱스토어 페이지 자체는 소실된 상태이며, 아래 리뷰 인용은 서비스 운영 당시 이를 인용한 뉴스/블로그/학생신문 기사를 통해 재구성한 것이다(직접 스토어 페이지 WebFetch 불가).

## 앱스토어 리뷰 감정 분석

### 호평
- **또래 연결·소속감**: Apple App Store 리뷰 인용 — "This app is overall just amazing and the fact you can connect your school to the app is amazing." (NewsChannel5 기사가 인용) [1]
- **분위기 순화 효과**: "This app has been so influential in my school where many people especially girls have insecurities and hate for themselves... you could actually see that problem were becoming more kind and accepting towards each other." (NewsChannel5 기사가 인용) [1]
- **단순한 UX**: Common Sense Media는 "내비게이션이 간단하고 기능이 제한적"이라 사용이 쉽다고 평가, 익명 투표라 "진짜 칭찬처럼 느껴진다"는 점과 논바이너리 옵션을 포함한 포용적 설계를 장점으로 꼽음 [2].
- 2022년 10월 Apple App Store 다운로드 1위(TikTok·BeReal 제침), 11월 초 기준 510만 다운로드 — 인기 자체가 초기 만족도의 방증으로 다수 매체가 인용 [3][4].

### 불만
- **가짜/의심스러운 칭찬**: 15세 사용자가 교정기를 끼고 있는데도 "Best Smile(최고의 미소)" 칭찬을 받자 이것이 "진짜(real)"인지 의심했다는 사례가 보도됨 — 익명 투표의 신뢰성 자체에 대한 회의 [5].
- **신원 검증 부재 → 가짜 계정/사칭 우려**: Common Sense Media는 "실제 학생이 아닌 사람도 지역 학교로 가입 가능"하다고 지적 [2]. Deseret News도 "정당한 전화번호만 있으면 누구든 실제 재학 증명 없이 계정을 만들 수 있다"며 성인이 학생으로 위장하는 것을 막을 방법이 없음을 인정한다고 보도 [6].
- **부정적 문항 존재**: 칭찬 앱을 표방했지만 일부 질문은 부정적 특성을 묻는다("누가 가장 때릴 것 같은가" 등) — Common Sense Media [2].
- **성장 다크패턴**: 시간당 12개 질문 제한 후 1시간 잠금, 친구 초대 시에만 즉시 해제 — 바이럴을 강제하는 설계로 지적됨 [2].
- **결제(God Mode) 관련 불만**: **$6.99/주(월 환산 약 $28) 단일가 구독**(2026-07-08 Workflow 사실검증으로 확정 — Appfigures·NextBigWhat 교차확인. 이전 버전에 있던 "주 $1.99~9.99" 범위는 뒷받침 근거를 찾지 못해 오류로 정정함)으로 "누가 투표했는지 힌트"를 파는 God Mode에 대해, 학생 리뷰는 "5달러를 아끼라, 그럴 가치가 없을 뿐 아니라 앱의 재미(미스터리)를 스스로 망친다"고 비판 — 더 많은 아이들이 결제에 중독되도록 유도할 수 있다는 우려도 제기됨 [7].
- **카테고리 전반의 "가짜 폴/봇" 불만(참고 사례, Gas 자체 데이터는 미수집)**: 동일 카테고리 앱 NGL·Sendit에 대해 TechCrunch가 실제 앱스토어 리뷰들을 분석한 결과, "bot", "bots", "fake messages", "fake questions", "scam", "wasted (돈을 낭비했다)" 같은 단어가 반복적으로 등장했다고 보도 — NGL은 자동화된 질문을 실제 친구가 보낸 것처럼 위장해 유료 힌트 구매를 유도했고, 이용자들이 "친구가 실제로 물어본 게 아니라 봇이었다"는 사실에 배신감을 느꼈다는 것이 핵심 불만이었음 [8][9]. Gas는 사전 제작된 정해진 문항(자유 텍스트 없음)이라 이 문제의 여지가 상대적으로 적지만, "결제해야 발신자를 알 수 있다"는 동일한 수익모델을 공유한다.

## 10대 안전성 논란

- **사이버불링 상대적 리스크는 낮은 편, 그러나 0표 아님**: Bark의 부모용 리뷰는 Gas를 NGL·Open 같은 익명 DM 앱보다 "차악(lesser of two evils)"으로 평가 — Gas에는 자유 텍스트 익명 DM이 없고 사전 제작된 투표 문항만 있어 직접적 괴롭힘 창구가 좁다는 이유. 다만 앱 밖(Discord·Slack·iMessage)으로 폴 결과를 스크린샷 캡처해 퍼뜨리는 간접 괴롭힘 가능성은 남아있다고 지적함(WebSearch 스니펫으로 확인, 원문 직접 인용은 403으로 재확인 불가) [10].
- **자존감·사회적 서열화 우려(전문가 비판의 핵심)**: 코넬대 커뮤니케이션학과 나탈리 바자로바(Natalie Bazarova) 교수는 "긍정적 피드백이 주목적이지만 사회적 비교와 인기 경쟁을 부추길 수 있다"고 지적, "이미 인기 있는 아이들에게 더 많은 관심이 쏠리면서 언급되지 않은 다른 학생들의 자존감을 낮출 수 있다"고 경고 [11].
- **"불안을 수익화한다"는 전문가 비판**: CBC The Current 인터뷰에서 한 기술 전문가는 "그들은 청소년의 사회적·심리적 불안을 수익화하기 위해 이 앱을 만들었다(They've built an app to monetize the social and psychological anxieties of adolescents)"고 비판. 투표받은 사람은 누가 투표했는지 알 수 없고, 이를 알려면 결제해야 하는 구조 자체가 "불안 조장 → 결제 유도"로 설계됐다는 지적 [12].
- **개인정보(위치·연락처) 우려**: 앱이 위치정보와 연락처 접근 권한을 요구하며, 개발사는 위치를 저장하지 않는다고 주장했지만 학부모 단체는 학교명·연락처 등 아동 데이터 수집 범위에 우려를 표함 [2][10].
- **인신매매 루머 파동(실제 학교·경찰 개입 사례)**: 2022년 10월 5일 중국의 한 단일 사용자 앱스토어 리뷰에서 시작된 "Gas가 인신매매(특히 성적 착취)에 연루됐다"는 낭설이, 미국 십대 팔로워가 거의 없는 TikTok 계정을 통해 확산됨. 이에 대응해:
  - 2022-10-31: 오클라호마주 피드몬트 경찰이 부모들에게 자녀 휴대폰을 확인하라고 권고.
  - 2022-11-03: 오클라호마주 옥타하 공립학교가 "아동이 다른 마을에서 납치되고 있으며 이 새 앱이 포식자가 위치를 알아내는 수단"이라는 페이스북 경고문을 게시(이후 철회).
  - Washington Post 등이 사실무근임을 확인·보도했으나, 실제 파급효과로 2주간 다운로드 정체, 하루 사용자의 3% 앱 삭제, 매출·평점 급락, 개발팀에 "아동 성매매" 비난 폭주 및 살해 위협까지 발생 [13].
  - (참고: 이는 루머로 판명됐지만, "익명 투표 앱은 아동 안전 루머에 취약하고 그 파급력이 실제 비즈니스 지표를 흔들 만큼 크다"는 선례로서 의미가 있음.)

## Discord의 실제 종료 사유

- **공식 발표(대외용)**: Discord 대변인은 "We acquired Gas with the goal of supporting our efforts to grow across new and core audiences(신규·기존 오디언스 확장 노력을 지원하기 위해 Gas를 인수했다)"고만 밝힘 — 종료 사유에 대한 구체적 설명은 회피 [14].
- **실제 사유(내부 메모, The Information 단독 입수 → TechCrunch 재인용)**: CEO Jason Citron이 직원들에게 보낸 메모에서 "Gas 인수의 주된 목적은 엔지니어링 인재 확보(acqui-hire)였다"고 밝혔고, "성장이 둔화될 때까지만 앱을 유지하기로 계획했었다"고 설명함 [14][15].
- **성장 붕괴가 결정적 트리거**: TechCrunch가 인용한 다운로드 데이터에 따르면 2022년 11월 월간 다운로드 약 310만 건에서 2023년 9월 약 2,900건으로 사실상 소멸 — 이 급격한 사용자 이탈이 종료 결정의 실질적 방아쇠였음 [14].
- **공식 종료 절차**: 2023-10-18/19 종료 발표, 2023-11-07부로 앱 완전 중단(위키피디아는 "급격한 사용자 감소"를 이유로 명시) [15][3].
- **패턴 — "인수 후 종료"가 창업자 개인 이력에서도 두 번째**: The Information 기사 제목 자체가 "Discord Shutters Gas, Making It Two in a Row for Gas Founder"로, Gas 창업자 Nikita Bier의 이전 앱 tbh 역시 2017년 Facebook에 인수된 뒤 2018년 "사용량 저조"로 종료된 바 있음 — 10대 대상 익명 소셜 앱의 acqui-hire 후 폐기라는 패턴이 반복됨 [16][3].
- **결론(중요)**: 조사한 1차 출처(TechCrunch, The Information 헤드라인/트위터 인용, Wikipedia) 어디에도 **"무디레이션 비용" 또는 "안전 이슈"를 공식/보도된 종료 사유로 직접 명시한 대목은 없었다.** 즉 Gas의 종료는 매체 보도 기준으로는 "인재 확보 목적 소진 + 자연적 성장 정체"로 설명되며, 안전성 논란(3번 항목의 인신매매 루머 등)이 종료의 공식 원인으로 언급된 근거는 미수집(원문 The Information 기사는 페이월로 본문 확인 불가, 검색 스니펫과 헤드라인만 확보) [15].

## 규제 리스크 사례(NGL FTC 등)

- **사건 개요**: 2024년 7월, FTC와 로스앤젤레스 카운티 지방검찰청(LA DA)이 익명 메시징 앱 "NGL: ask me anything" 운영사 NGL Labs 및 공동창업자 2인(Raj Vir, Joao Figueiredo)을 상대로 합의(consent order) 도달 [17][19].
- **핵심 혐의 1 — 가짜 메시지로 결제 유도(bait-and-switch)**: NGL은 "I've had a crush on you for years" 같은 문구를 포함해 1,000개 이상의 AI 생성 메시지를 만들어 마치 실제 지인이 보낸 것처럼 위장해 발송. 이용자가 발신자를 궁금해하면 "구독하면 신원을 알 수 있다"고 유인했지만, 실제로는 봇이 보낸 메시지라 구독해도 신원이 밝혀지지 않았음 [17][18][19].
- **핵심 혐의 2 — 기만적 정기결제**: "NGL Pro"를 일회성 결제처럼 보이게 했지만 실제로는 사용자 동의 없이 주당 최대 $9.99가 반복 청구됨 [18][19].
- **핵심 혐의 3 — AI 모더레이션 허위 광고**: AI 콘텐츠 모더레이션이 사이버불링 등 유해 메시지를 걸러낸다고 주장했으나 FTC는 이를 허위로 판단 [19].
- **핵심 혐의 4 — 미성년자 타겟 마케팅**: "안전한 공간(safe space)"이라 마케팅하면서 사실상 미성년자에게 무분별하게 홍보 — FTC는 이를 문제 삼아 **18세 미만에게 앱을 제공하는 것 자체를 금지**하는 명령을 내림 [17][19].
- **금전적 제재**: 총 합의금 $5,000,000 중 **$4,500,000은 소비자 환급(redress)**, 나머지 $500,000은 LA DA에 대한 민사 벌금으로 배분(자료에 따라 총액을 "$4.5M 합의"로만 표기하는 경우도 있어 다소 혼재하나, 다수 출처는 $5M 중 $4.5M 환급 구조로 설명) [17][18]. 2022년 1월~2024년 7월 사이 NGL Pro 결제 이력이 있는 18세 이상 이용자가 환급 신청 대상이며, FTC는 2026년 1월 환급 신청 절차 개시를 발표함(신청 마감 2026-04-06으로 안내한 2차 자료 존재) [19][20].
- **동일 유형 후속 사례 — Sendit(2025)**: FTC가 Sendit 운영사 Iconic Hearts와 CEO를 상대로 제소. 혐의: (1) 13세 미만임을 자체 인지하고도(2022년 116,000명이 13세 미만이라 자진 신고) 부모 동의 없이 전화번호·생일·사진·SNS 계정 등 아동 개인정보 수집(COPPA 위반), (2) "Diamond Membership" 결제 시 발신자를 알려준다고 홍보했지만 실제로 밝혀주지 않았고, 일부 메시지는 회사·CEO가 직접 조작해 마치 실제 지인이 보낸 도발적/성적 메시지처럼 꾸밈, (3) 첫 결제만 하는 것처럼 보이게 하고 실제로는 주당 $9.99 반복 청구. 이 건은 (합의가 아니라) DOJ 이관을 통한 소송 진행 중으로, 아직 합의금 확정 전 단계임(2025-09-30 제소) [21][22].
- **오늘 해볼까에 대한 시사점**: (a) 결제 유도 문구에 실제 데이터가 아닌 것을 실제처럼 보이게 하는 장치(가짜 발신자, 가짜 힌트)는 미국 규제당국이 명확히 "기만적 관행"으로 처벌한 전례가 있다 — 코인/포인트로 "누가 나를 뽑았는지 힌트"를 파는 기능을 넣을 경우 실데이터 기반임을 명확히 하고 과장 광고를 피해야 함. (b) 구독/정기결제는 최초 결제 시점에 청구 주기·해지 방법을 명확히 고지해야 한다(다크패턴 회피). (c) 미성년자를 서비스 대상에 포함할 경우, "안전 공간"이라는 표현과 실제 모더레이션 수준 사이 괴리가 없어야 하며 아동 개인정보 수집 시 COPPA 상당의 동의 절차가 필요하다. 한국은 FTC/COPPA 직접 적용 대상은 아니지만, 개인정보보호법상 만 14세 미만 법정대리인 동의 규정과 사실상 동일한 리스크 구조이므로 설계 초기부터 연령 게이트·동의 흐름을 고려할 필요가 있음.

## 출처 목록

1. NewsChannel5, "'Gas' fueled by fans, races ahead of TikTok in app store ratings" — https://www.newschannel5.com/news/gas-fueled-by-fans-races-ahead-of-tiktok-in-app-store-ratings (앱스토어 리뷰 인용은 WebSearch 스니펫으로 확인, 페이지 재요청 시 본문 미노출)
2. Common Sense Media, "Gas App Review" — https://www.commonsensemedia.org/app-reviews/gas
3. Wikipedia, "Gas (app)" — https://en.wikipedia.org/wiki/Gas_(app)
4. TechCrunch, "Discord acquires Gas, a compliments-based social media app for teens" (2023-01-17) — https://techcrunch.com/2023/01/17/discord-acquires-gas-a-compliments-based-social-media-app-for-teens/
5. Today.com, "Teens love the anonymous new Gas app: Here's what parents should know" — https://www.today.com/parents/family/what-is-gas-app-rcna64969 (본문 WebFetch 403, 내용은 WebSearch 스니펫으로 확인)
6. Deseret News, "Is Gas app safe?" — https://www.deseret.com/23473767/is-gas-app-safe/
7. CVHS News, "Gas or Trash: An honest review on the app that's taking high schools by storm" — https://cvhsnews.org/11598/arts-entertainment/gas-or-trash-an-honest-review-on-the-app-thats-taking-high-schools-by-storm/ (본문 WebFetch 403, 인용은 WebSearch 스니펫)
8. TechCrunch, "NGL makes $2.4M as users complain about being scammed" (2022-07-11) — https://techcrunch.com/2022/07/11/anonymous-social-ngl-tops-15m-installs-2-4m-in-revenue-as-users-complain-about-being-scammed/
9. TechCrunch, "Top anonymous social app NGL forced to stop tricking its users" (2022-08-04) — https://techcrunch.com/2022/08/04/top-anonymous-social-app-ngl-forced-to-stop-tricking-its-users/
10. Bark, "Is the Gas App Safe? A Gas App Review for Parents" — https://www.bark.us/app-reviews/apps/gas-app/ (WebFetch 403, 내용은 WebSearch 스니펫으로만 확인 — 원문 재검증 필요)
11. Cornell Chronicle, "New app based on complimenting others could backfire for teens" — https://news.cornell.edu/media-relations/tip-sheets/new-app-based-complimenting-others-could-backfire-teens
12. CBC Radio The Current, "This app allows teens to compliment each other anonymously. One expert warns it monetizes their anxiety" — https://www.cbc.ca/radio/thecurrent/gas-app-teens-high-school-1.6718229 (WebFetch 403, 내용은 WebSearch 스니펫)
13. Wikipedia, "Gas (app)" 인신매매 루머 섹션(상동, 3번 출처와 동일 문서 내 별도 절)
14. TechCrunch, "Discord kills Gas, the anonymous compliments app it bought nine months ago" (2023-10-19) — https://techcrunch.com/2023/10/19/discord-kills-gas-anonymous-compliments-app-bought-nine-months-ago/
15. The Information, "Discord Shutters Gas, Making It Two in a Row for Gas Founder" — https://www.theinformation.com/articles/discord-shutters-gas-making-it-two-in-a-row-for-gas-founder (페이월, 본문 미확인 — 제목·2차 인용(X/TechCrunch)으로만 확인)
16. X(Twitter), Mark Matousek 인용 — https://x.com/matousekmark/status/1714742829728116894
17. FTC, "FTC Order Will Ban NGL Labs and its Founders from Offering Anonymous Messaging Apps to Kids Under 18..." (2024-07) — https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-order-will-ban-ngl-labs-its-founders-offering-anonymous-messaging-apps-kids-under-18-halt (WebFetch 403, WebSearch 스니펫으로 확인)
18. ClassAction.org, "$4.5M NGL Labs Settlement Ends FTC Case Over Alleged Fake Messages on App Marketed to Teens" — https://www.classaction.org/news/4.5m-ngl-labs-settlement-ends-ftc-case-over-alleged-fake-messages-on-app-marketed-to-teens
19. FTC, "Anonymous messaging app targeting teens: Read the disturbing allegations in FTC and Los Angeles DA action against NGL" — https://www.ftc.gov/business-guidance/blog/2024/07/anonymous-messaging-app-targeting-teens-read-disturbing-allegations-ftc-los-angeles-da-action (WebFetch 403, WebSearch 스니펫)
20. FTC, "FTC Announces Refund Claims Process for NGL Users..." (2026-01) — https://www.ftc.gov/news-events/news/press-releases/2026/01/ftc-announces-refund-claims-process-ngl-users-affected-deceptive-tactics-unauthorized-charges (제목만 확인, 본문 미수집)
21. TechCrunch, "Anonymous question app Sendit deceived children and illegally collected their data, FTC alleges" (2025-09-30) — https://techcrunch.com/2025/09/30/anonymous-question-app-sendit-deceived-children-and-illegally-collected-their-data-ftc-alleges/
22. FTC, "FTC Alleges Sendit App and its CEO Unlawfully Collected Personal Data from Children..." (2025-09) — https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-alleges-sendit-app-its-ceo-unlawfully-collected-personal-data-children-deceived-users-about

### 미수집 항목
- Gas 앱 자체의 실제 앱스토어(iOS/Android) 원문 리뷰 전수: 앱이 종료되어 스토어 페이지가 내려갔고, Wayback Machine 등 아카이브 직접 조회는 이번 조사 범위에서 시도하지 않음(추가 조사 시 web.archive.org로 재시도 권장).
- Discord 내부 메모(Jason Citron memo) 원문 전체 텍스트: The Information 기사가 페이월에 있어 본문 미확인, 2차 인용(TechCrunch, X)으로만 재구성.
- "학교 내 갈등"을 구체적으로 다룬 국내외 학부모 단체(예: PTA) 공식 성명: 검색 범위 내에서 개별 기사 이상의 단체 성명은 발견하지 못함.
