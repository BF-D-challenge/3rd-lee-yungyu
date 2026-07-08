---
name: gas-app--gap-2-psychology-dark-patterns
description: 완성도 비평으로 보강한 갭 문서. 기존에 언론 코멘트 2건(코넬대 tip-sheet, CBC 인터뷰, 둘 다 동료심사 없음)뿐이던 심리학적 근거를 Festinger 사회비교이론·Leary 소시오미터이론·Nesi & Prinstein(2019, 716명 종단연구)·Gray/Mathur 다크패턴 taxonomy 등 학술 문헌 15건 이상으로 대체·보강하고, 투표수/순위 기본 비노출 등 근거 기반 설계 지침 5개를 도출했다.
metadata:
  type: research
  topic: gas-app
  category: gaps
  date: 2026-07-08
---

# 심리학/다크패턴 디자인 윤리 근거가 소프트 인용 2건(코넬대 tip-sheet + CBC 라디오 인터뷰, 둘 다 원문 403이라 2차 인용)에 그침 — 학술적 깊이 부재

> 조사일: 2026-07-08 · 조사자: 리서치 서브에이전트 · 방법: WebSearch/WebFetch (원문 접근 가능한 것은 직접 인용, 403/페이월은 2차 인용 표시)

## 0. 기존 소프트 인용 2건 재검증

| 인용 | 실제 인물 | 소속/직함 | 학술 근거 유무 |
|---|---|---|---|
| 코넬대 tip-sheet | **Natalie Bazarova** | Cornell Communication 부교수, Cornell Social Media Lab 소장 | 본인 연구실 연구 관점("소셜미디어의 화폐는 사회적 검증")을 배경으로 언급했으나, tip-sheet 자체에는 논문 인용·수치 없음. 학술 논문화되지 않은 언론 코멘트. |
| CBC 라디오 | **Alexandra Samuel** | 밴쿠버 소재 테크 저널리스트, *Work Smarter with Social Media* 저자 | 학자가 아니라 **저널리스트**. "청소년 불안을 화폐화(monetize)한다", "10대 사회적 불안을 착취(preying)한다"는 발언은 저자 개인 견해이며 인용 논문 없음. |

원문: news.cornell.edu(직접 접근 성공, 403 아님) / cbc.ca(직접 접근 시 403, 검색엔진 스니펫으로 2차 확인). 즉 갭 지적대로 **둘 다 동료심사(peer review)를 거친 학술 근거가 아니라 언론 인터뷰 코멘트**임이 재확인됨. 이하 이 공백을 실제 학술 문헌으로 채운다.

---

## 1. 사회비교이론(Social Comparison Theory) — 학술 근거

### 1-1. 이론적 토대
- **Festinger, L. (1954). "A Theory of Social Comparison Processes." *Human Relations*, 7(2).** — 객관적 기준이 없을 때 인간은 타인과의 비교로 자신의 능력·의견을 평가한다는 원 이론. (journals.sagepub.com/doi/10.1177/001872675400700202)
- **Leary, M. R. (1995, 2005) 소시오미터 이론(Sociometer Theory)** — 자존감은 "사회적 포함/배제 정도를 실시간으로 감시하는 계기판"이라는 이론. 사회적 포함 경험은 자존감을 높이고, 배제 경험(무시·낮은 순위·투표 없음 등)은 자존감을 낮춘다는 것이 핵심 메커니즘. (elaborer.org/cours/A12/lectures/Leary1995.pdf, researchgate.net/publication/200008857)
  - 후속 검증: Schmidt, Dirk, Neubauer, Schmiedek (2021), *Journal of Social and Personal Relationships* — 아동의 일상에서 또래로부터의 "포함(inclusion)"은 하루 단위 자존감 변화와 유의미하게 연관되나 "배제(exclusion)"는 상대적으로 약한 연관(원문 요약 기준). (journals.sagepub.com/doi/abs/10.1177/0890207020962328)
  - **오늘 해볼까 적용점**: 카드 공개 후 "투표 0표/무반응"이 공개적으로 드러나는 UX는 소시오미터 이론상 배제 신호로 해석되어 자존감 저하를 유발할 잠재 경로가 있음.

### 1-2. 청소년 특이 취약성 — 최신 실증 연구
- **Yu-Hsing Chen (2025). "A comparative study of state self-esteem responses to social media feedback loops in adolescents and adults." *Frontiers in Psychology*, DOI: 10.3389/fpsyg.2025.1625771.**
  - 표본: 청소년 120명(13-18세, 평균 15.6세) vs 성인 120명(25-40세), 모의 SNS 환경에서 긍정/중립/부정 피드백 조건 무작위 배정.
  - 핵심 수치: 청소년이 성인보다 피드백에 유의미하게 더 민감(F=6.65, p=0.002) — 긍정 피드백 후 자존감 상승 폭이 더 크고 부정 피드백 후 하락 폭도 더 큼.
  - 사회비교성향이 피드백-자존감 관계를 부분매개(간접효과 B=-0.14), 지각된 진정성(authenticity)이 부정 피드백의 해악을 완화(상호작용 B=0.19, p=0.007).
  - 출처: pmc.ncbi.nlm.nih.gov/articles/PMC12500540/

- **Nesi, J., & Prinstein, M. J. (2019). "In Search of 'Likes': Longitudinal Associations Between Adolescents' Digital Status Seeking and Health Risk Behaviors." *Journal of Clinical Child & Adolescent Psychology*, 48(5), 740-748.**
  - 표본: 716명(1차) → 630명(1년 후 추적), 평균 15-18세(평균 16.01세), 여학생 54.2%.
  - "디지털 지위 추구"(좋아요·댓글 등 정량 지표 축적에 공을 들이는 행동)를 사회측정법(sociometric)으로 측정.
  - **핵심 결과**: 디지털 지위 추구 성향이 높은 청소년은 1년 뒤 물질사용·성적위험행동이 유의하게 증가 — 그리고 이 관계는 오프라인 실제 인기도와 **독립적**으로 성립함. 즉, "실제로 인기 있는가"보다 "정량 지표를 좇는 행동 자체"가 위험 행동을 예측.
  - 출처: pmc.ncbi.nlm.nih.gov/articles/PMC6279624/
  - **오늘 해볼까 적용점**: 슬롯/카드 결과에 노출 투표수·순위 같은 정량 지표를 붙이면, 실제 인기와 무관하게 "그 지표를 좇는 행동" 자체가 별도의 위험 경로가 될 수 있음을 시사.

- **Frontiers (2020/2021 게재, PMC7726329). "Sociometric Popularity, Perceived Peer Support, and Self-Concept in Adolescence."**
  - 결과: 사회측정적 인기도는 "지각된 또래 지지"를 매개로 자기개념(self-concept)과 연결됨. 즉 인기도 자체보다 "내가 지지받고 있다고 느끼는가"가 핵심 매개변수 — 순위·인기 점수를 직접 노출하는 것보다 "지지/응원"을 느끼게 하는 설계가 자존감에 더 안전.

- **디지털 지표 시각성의 인과적 증거 — Instagram 좋아요 수 숨기기 실험**
  - Instagram은 2019년 호주·캐나다·일본 등에서 '좋아요 수 비공개' 테스트를 시작, 이후 전세계 확대. CEO Adam Mosseri: "인스타그램을 덜 경쟁적으로 만들어 사람들이 서로 연결에 집중할 여지를 주려는 것"이라고 설명. (techcrunch.com/2019/11/14/instagram-private-like-counts/)
  - 관련 실증 연구: 280명 대상 실험에서 "원하는 것보다 더 많은 좋아요를 받으면 외로움은 줄지만 부정 정서는 증가"하며 이 효과는 **좋아요 수의 가시성(visibility)**에 의해 증폭됨을 확인. (sciencedirect.com/science/article/pii/S0191886920307005)
  - 또 다른 연구(PMC10604111): "능력 관련 사회비교(순위·등수처럼 능력을 직접 비교하게 만드는 유형)"는 "의견 관련 비교"보다 유의하게 더 낮은 웰빙과 연관.
  - **오늘 해볼까 적용점**: 정량 지표(투표수) 자체를 노출하는 것이 이미 하나의 설계 선택이며, 업계 최대 플랫폼이 "가시성을 낮추는" 방향으로 이동한 선례가 있음 — 결과 카드에 투표수/순위를 기본 노출할지 여부를 재검토할 근거가 됨.

### 1-3. 국내(한국) 연구
- 다수의 국내 논문이 SNS 이용시간·좋아요 등 정량 피드백과 자아존중감 간 **일관된 약한 부적 상관**을 보고(메타분석 기준), 사회비교경향성이 매개변수로 작동함을 반복 확인. 예: "대학생의 사회비교경향성이 자아존중감을 매개로 SNS 중독에 미치는 영향"(synapse.koreamed.org/upload/synapsedata/pdfdata/0200jkachn/jkachn-29-371.pdf), "중학생의 SNS 이용시간과 자아존중감의 관계: 신체적 자아상과 안전체감의 매개효과"(childstudies.org).
- "가스 앱" 자체를 다룬 국내 학술 논문(KCI/RISS)은 검색 범위 내 **미수집**(국내 학술DB에 해당 주제로 직접 연구된 논문 없음 — 스타트업 소개 기사·브런치 포스팅 수준만 존재: disquiet.io/@woojungkim/makerlog/5773, brunch.co.kr/@clickb7402/145).
- "다크패턴 + 청소년 자존감"을 직접 결합한 국내 학술 논문도 **미수집**(검색상 확인되지 않음 — 국내에서는 다크패턴 연구가 주로 전자상거래/소비자보호법 쪽에 집중된 것으로 보이며, 청소년 자존감·사회비교와 결합한 논문은 노출되지 않음).

---

## 2. 다크패턴 분류체계(Taxonomy) — 학술 연구

### 2-1. 최초 CHI 학술 타이포놀로지
**Gray, C. M., Kou, Y., Battles, B., Hoggatt, J., & Toombs, A. L. (2018). "The Dark (Patterns) Side of UX Design." *Proceedings of the 2018 CHI Conference on Human Factors in Computing Systems*, 1-14.** (dl.acm.org/doi/10.1145/3173574.3174108)
- 실무자가 식별한 다크패턴 사례를 수집해 내용분석, **5개 카테고리** 타이포놀로지 도출: **Nagging(끈질긴 방해), Obstruction(의도적 방해), Sneaking(은폐), Interface Interference(인터페이스 위계 조작), Forced Action(강제 행동)**.
- 핵심 주장: 다크패턴은 "사용자 가치를 주주/사업자 가치로 치환"하는 설계이며, UX의 사용자중심설계 원칙을 심리적 통찰을 조작에 쓰는 방향으로 전복시킴.

### 2-2. Princeton/UChicago 대규모 실증 연구 (CSCW, CHI 아님 — 정확한 학회명 정정)
**Mathur, A., Acar, G., Friedman, M. J., et al. (2019). "Dark Patterns at Scale: Findings from a Crawl of 11K Shopping Websites." *Proceedings of the ACM on Human-Computer Interaction*, Vol. 3, No. CSCW.** (webtransparency.cs.princeton.edu/dark-patterns/, arxiv.org/abs/1907.07032)
- ※원 갭 지적문의 "CHI Princeton"은 정확히는 **CSCW**(Computer-Supported Cooperative Work, ACM 저널 CSCW 호)임을 확인. Princeton/UChicago 공동연구인 것은 맞음.
- 11,000여개 쇼핑사이트 크롤링, 1,818건의 다크패턴 인스턴스 발견(사이트의 11.1%), 22개 제3자 업체가 이런 패턴을 소프트웨어로 공급.
- **7개 카테고리·15개 유형** (인지편향/심리 메커니즘 매핑 포함):
  1. **Sneaking**(정보 은닉) — Sneak into Basket, Hidden Costs, Hidden Subscription
  2. **Urgency**(시간 압박) — Countdown Timer(393건), Limited-time Message(88건)
  3. **Misdirection**(시각·감정 조작) — Confirmshaming, Visual Interference, Trick Questions, Pressured Selling
  4. **Social Proof**(사회적 증거/밴드왜건 편향) — Activity Messages(313건, "다른 사람이 방금 구매/조회함"), Testimonials of Uncertain Origin(12건)
  5. **Scarcity**(희소성 편향) — Low-stock Message(632건), High-demand Message(47건)
  6. **Obstruction**(탈출 방해) — Hard to Cancel(31건, 가입은 쉽고 해지는 어렵게)
  7. **Forced Action**(강제 행동) — Forced Enrollment(6건, 계정 생성·정보 공유 강제)

### 2-3. 아동·청소년 대상 다크패턴 — 후속 연구
- **Radesky, J. 외 8인 (2022). *JAMA Network Open*.** — 3-5세 아동 160명이 최다 사용한 앱 3개씩 분석, 훈련된 코더 2명이 10-15분씩 플레이하며 조작적 디자인 식별. **앱의 98.8%가 최소 1개 조작적 디자인 포함.** 게임연장 유도 요소(내비게이션 제약 45.9%, 시각적 유인물 45.1%), 구매유도 요소(시각적 유인물 45.9%, 네비게이션 제약 36.8%). 저소득층 아동이 더 많이 노출됨. (pmc.ncbi.nlm.nih.gov/articles/PMC9206186/)
- **Renaud, K., Sengul, C., Coopamootoo, K., Clift, B., Taylor, J., Springett, M., Morrison, B. (2024). "'We're Not That Gullible!' Revealing Dark Pattern Mental Models of 11-12-Year-Old Scottish Children." *ACM Transactions on Computer-Human Interaction*.** (dl.acm.org/doi/10.1145/3660342)
  - 11-12세 스코틀랜드 아동 대상 질적 연구. 아동들은 온라인 기만을 "수상하다"고 인지하는 능력이 있으나 오히려 **과도하게 경계**해 무해한 경고에도 최악의 시나리오를 상정하는 역설 발견. 시사점: 특정 패턴 사례 나열보다 "왜 이런 설계를 하는가"에 대한 근본적 이해 교육이 필요.
  - 관련 후속: "Growing Up With Dark Patterns: How Children Perceive Malicious User Interface Designs" (Nordic Conference on HCI, dl.acm.org/doi/10.1145/3679318.3685358) — 세부 내용 **미수집**(초록 이상 접근 못함).
  - "A cautionary tale: children, dark patterns and normative perspectives" (Oñati Socio-Legal Series) — 아동은 성인과 동일한 UI를 쓰지만 인지적으로 더 취약하다는 규범적(법적) 논의. 세부 내용 **미수집**(원문 페이월).

---

## 3. 익명 또래평가/랭킹 앱 선례 — 직접 비교 사례

### 3-1. Peeple (2015-2016, "사람을 별점 매기는 앱")
- 최초 출시 계획: 본인 동의 없이도 지인이 1-5점으로 평가 가능, 옵트아웃 불가.
- BYU 가족학 교수: 이 랭킹 시스템이 "비인간화(dehumanizing)"된다며 "우리가 자아 감각을 타인의 인식에 근거해 형성하는 불행한 경향을 심화시킬 뿐"이라 비판. (newstatesman.com/science-tech/2015/10)
- 비평가들은 영화 *Mean Girls*의 "Burn Book"에 비유하며 사이버불링 도구가 될 것이라 경고. 4만 명 가까운 반대 서명 청원 발생.
- 결국 **본인 동의 없이는 평가 게시 불가**로 정책 변경 후 출시. → **오늘 해볼까 시사점**: "당사자 동의 후 공개" 원칙의 실제 선례.

### 3-2. Yik Yak (2013-2017, 익명 지역 기반 앱)
- 미국 대학·고등학교에서 혐오발언·사이버불링·폭탄테러 협박 등으로 논란, 2017년 서비스 종료(2021년 재출시 후 2023년 Sidechat에 인수).
- 실증 연구: 2016년 4개 주 19개 대학 캠퍼스의 Yik Yak 게시물 분석 결과 **친사회적 메시지가 괴롭힘성 메시지보다 5.23배 많았으나**, 괴롭힘 메시지 빈도는 정서적 도움을 구하는 메시지 빈도와 양의 상관관계를 보임(PMC7293060, ncbi.nlm.nih.gov/pmc/articles/PMC7293060/). → 익명 앱이 전체적으로는 긍정적 사용이 더 많을 수 있으나, 취약한 이용자에게는 괴롭힘 노출과 정서적 위기가 동시에 몰릴 수 있음을 시사.

### 3-3. NGL (익명 질문 앱) — FTC/LA 지방검찰 제재 (직접적 규제 선례)
- 2024년 7월, FTC와 LA지검이 NGL과 공동창업자 2인을 **미성년자 대상 기만적 마케팅** 혐의로 제소.
- 핵심 위법 행위: **가짜 메시지를 실제 사용자가 보낸 것처럼 위장**해 "누가 보냈는지 알려면 유료 결제(주당 최대 $9.99)"를 유도했으나, 실제로는 발신자 신원을 알려주지 않고 "발신 시간, OS 종류, 대략적 위치" 같은 쓸모없는 "힌트"만 제공.
- AI 콘텐츠 조정(사이버불링 필터링) 기능이 있다고 허위 주장.
- 결과: 18세 미만 대상 익명 메시징 앱 마케팅 **영구 금지**, 환불 $450만 명령. (ftc.gov/news-events/news/press-releases/2024/07)
- **오늘 해볼까 직접 시사점**: "투표/평가 결과를 보려면 결제"라는 구조 자체가 NGL이 연방정부로부터 제재받은 비즈니스 모델과 **형태적으로 동일**함. 오늘 해볼까가 결제를 유도하려면 (a) 실제로 유의미한 정보를 제공해야 하고 (ب) 미성년자 대상 마케팅이 되지 않도록 각별히 설계해야 함.

### 3-4. Gas — Discord 인수 후 종료 배경 (기존 리서치 보강)
- Discord는 2023년 1월 Gas 인수(누적 설치 740만, 소비지출 약 700만 달러), 같은 해 10월 서비스 종료 발표(11월 7일부).
- 종료 사유는 안전 문제가 아니라 **엔지니어링 인재 확보 목적** + 사용자 감소였음(Discord CEO Jason Citron이 내부 메모에서 밝힘). 다만 2022년 10월 "인신매매 연루" 루머(중국발 리뷰 1건에서 시작해 TikTok으로 확산, 전문가 대부분 허위로 판단)로 경찰서·학교·지역언론이 경고를 발령한 바 있음. → 이 루머 자체는 학술적 근거가 없는 도시전설이었으나, **왜 이런 루머가 이 앱에서 특히 잘 퍼졌는가**(불특정 다수가 미성년자를 평가/투표하는 구조에 대한 사회적 불안)는 별도로 짚을 가치가 있음.

---

## 4. 실질적 설계 지침으로 연결 가능한 자료

- **미국 연방 보건당국(공중보건서비스단장) 자문서한**: *Social Media and Youth Mental Health: The U.S. Surgeon General's Advisory* (2023). 95%의 13-17세가 SNS 사용, 1/3 이상이 "거의 항시" 사용한다고 보고하며, 기술기업·정책입안자·연구자·가족 각각에 대한 다면적 대응을 권고. (hhs.gov/sites/default/files/sg-youth-mental-health-social-media-advisory.pdf)
- **Mylonopoulou, V., Väyrynen, K., Isomursu, M. (2018). "Designing for Behavior Change: 6 Dimensions of Social Comparison Features." HICSS 2018.** — 문헌에서 도출한 "사회비교 기능 설계의 6개 차원"을 제시하는 논문이나, **본문 PDF 접근 실패로 6개 차원의 정확한 명칭·정의는 미수집**(초록 수준에서만 "6개 차원이 문헌에서 도출되었고 각 차원별 대안 설계안을 제시"함을 확인, scholarspace.manoa.hawaii.edu/items/367adc12-5be7-46c8-9d22-c20e633f52cd). 단, 관련 스코핑 리뷰(PMC7148546, "Social Comparison Features in Physical Activity Promotion Apps")에서 도출되는 반복 권고는: **(1) 비교 대상의 관련성/동질성(relatability)을 확보할 것, (2) 이상화된 콘텐츠 노출을 제한할 것, (3) 사용자가 누구와 비교할지·무엇을 볼지 통제할 수 있게 할 것.**
- **Instagram의 좋아요 수 비공개 실험**(위 1-2절)은 "정량 지표의 기본 가시성을 낮춘다"는 실제 플랫폼 차원의 대응 선례로 직접 참고 가능.

---

## 5. "오늘 해볼까" 설계 적용 시사점 (근거 기반 제안)

1. **투표수/순위를 카드 결과에 기본 노출하지 않는다.** 근거: 소시오미터 이론(배제 신호화 위험) + Nesi & Prinstein(정량 지표 추구 자체가 위험행동과 연관) + Instagram 좋아요 숨기기 선례.
2. **"누가 투표했는지 보려면 결제" 구조는 NGL이 연방 제재를 받은 비즈니스 모델과 동일 형태이므로 금지 또는 재설계.** 결제 유도가 필요하다면 실질적 가치(예: 실행 플랜, 수요 리포트 — CLAUDE.md 원칙과 일치)로 전환하고, 신원 공개를 유료화하지 않는다.
3. **투표 결과 공개는 당사자 동의 후에만(Peeple 후기 정책 선례).** 투표 수신자(카드 주인공)가 "지금 결과 볼래요/나중에요"를 선택할 수 있게 하여 부정적 결과에 대한 통제감을 준다.
4. **다크패턴 자가점검(Mathur 7분류) 체크리스트**: 카운트다운 타이머로 결제 압박(Urgency) 금지, "지금 3명이 보고 있어요" 식 활동 메시지(Social Proof) 신중히, 해지/이탈 경로를 가입 경로만큼 쉽게(Obstruction 금지), 결제 없이 필수 기능 이용 강제(Forced Action) 금지.
5. **비교 대상의 동질성 확보**: 전체 유저 랭킹이 아니라 "나와 비슷한 상황의 소수 지인" 단위로 비교를 국한해 상향비교(upward comparison) 노출을 줄인다.

---

## 6. 미수집 항목 정리

- Mylonopoulou et al. (2018) HICSS 논문의 "6개 차원" 정확한 명칭·정의 — 원문 PDF 접근 실패로 미수집.
- "Growing Up With Dark Patterns" (NordiCHI 2024)의 구체적 발견 — 초록 이상 미수집.
- "A cautionary tale: children, dark patterns and normative perspectives" (Oñati Socio-Legal Series)의 세부 논증 — 페이월로 미수집.
- "가스 앱"을 직접 대상으로 한 한국 국내 학술논문(KCI/RISS 게재) — 검색 범위 내 존재 확인 안 됨(미수집, 사유: 스타트업 소개/실무 콘텐츠만 존재하고 학술 논문화된 사례를 찾지 못함).
- "다크패턴 + 청소년 자존감"을 직접 결합한 국내 학술 논문 — 미수집(사유: 국내 다크패턴 연구는 전자상거래/소비자법 분야에 집중되어 있고, 본 주제와 결합한 논문이 검색되지 않음).
- CBC 라디오 인터뷰 원문 전체 오디오/트랜스크립트 — 직접 접근 시 403, 검색엔진 스니펫으로 핵심 인용구만 2차 확인(Alexandra Samuel 발언).
