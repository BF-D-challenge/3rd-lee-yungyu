# 바이럴 스파이크 이후 '실제 참여(리텐션) 붕괴'의 제품 메커니즘 미분석 — 리서치 자체에 있는 단서를 못 따라감

조사 방법: WebSearch + WebFetch(42matters, Sensor Tower, Wikipedia, Lenny's Newsletter, GitHub 트랜스크립트, LinkedIn, thehustle.co 등). 조사일 2026-07-08.

**조사 과정에서 확인한 제약**: WebSearch는 reddit.com 크롤링이 차단되어 있어(`API Error 400: reddit.com not accessible`) 기존 `community/INSIGHTS.md`가 확보한 것 이상의 신규 Reddit 원문 인용은 이번에도 추가하지 못했다. 이 세션에는 `rdt-cli`/`twitter-cli` 실행 파일이 로드되어 있지 않아(다른 세션/스킬 환경 전용으로 추정) Reddit·X 직접 검색은 시도했으나 실행 불가했고, WebSearch/WebFetch로 대체 가능한 범위까지만 조사했다. 이 한계는 아래 "미수집" 절에도 명시한다.

## 결론 요약 (TL;DR)

리서치 갭에서 제시된 자체 증거(2023-01 r/teenagers "그거 이미 예전에 죽은 앱인 줄 알았어")는 우연한 발언이 아니라 **실제 정량 데이터로 뒷받침되는 사실**이었다. Gas의 다운로드는 **Discord 인수(2023-01-17) 발표보다 약 8주 앞선 2022년 추수감사절(11/24) 전후로 이미 정점 대비 붕괴가 시작**되었고, 인수 시점에는 이미 일일 다운로드가 피크의 2% 미만(피크 124,558건/일 → 약 2,000건/일)까지 떨어져 있었다. 즉 "Discord가 애초에 키울 생각이 없었다"는 경영 차원 설명은 **원인이 아니라 이미 벌어진 사용자 이탈에 대한 사후 합리화**에 가깝다.

원인은 최소 세 갈래로 갈라진다: **(1) 2022-10-05 시작된 인신매매 괴담**(별개의 신뢰 충격, 2주 다운로드 정체 + 단일일 3% 삭제), **(2) 구조적 K-factor 붕괴**(창업자 Nikita Bier 본인이 밝힌 "나이 1살 늘 때마다 유저당 초대 발송 20% 감소"라는 자기 데이터 — 학교 그래프가 포화되는 것과는 별개로, 애초에 이 장르의 바이럴 계수는 유한하게 설계돼 있음), **(3) 1회성 호기심(누가 나를 뽑았는지) 소진 + 신뢰 훼손**("가짜 답장" 의심이 변동보상 루프의 전제인 "진짜일 수도 있다는 불확실성"을 깨뜨림). 세 원인 모두 "오늘 해볼까"의 카드 공개 UX에 구조적으로 대응되는 리스크다.

---

## 1. 정량 타임라인 — 실사용 붕괴는 인수보다 최소 8주 빨랐다

| 시점 | 데이터 | 출처 |
|---|---|---|
| 2022-08-29 | 앱 출시 | Wikipedia |
| 2022-10-05 | 인신매매 괴담 시작(중국발 유저 리뷰 1건에서 발원, TikTok 확산) | Wikipedia, Lead Stories, Washington Post |
| 2022-10월 말 | 괴담 절정 — **다운로드 2주간 정체, 단일일 3% 유저 삭제**, 평점·매출 하락 | Wikipedia |
| 2022-11-10 | **다운로드 피크: 124,558건/일** | 42matters |
| 2022-11-24 (추수감사절) | **"이상하게도(oddly enough) 추수감사절 무렵" 다운로드 급락 시작** | 42matters |
| 2022-12초 | 누적 1,000만 유저, 월간활성유저(MAU) 약 300만 | 기존 `PRODUCT_OVERVIEW.md`, Sensor Tower MMM(2023-01-23) |
| 2022-12-03 | 앱스토어 카테고리가 "Social Networking"에서 "Lifestyle"로 재분류 | 42matters |
| 2023-01-17 | Discord, Gas 인수 발표 (이 시점 이미 다운로드 붕괴 8주 경과) | TechCrunch |
| 2023-01-29 | **일일 다운로드 약 2,000건 — 피크 대비 약 98% 감소**, Lifestyle 카테고리 82위 | 42matters |
| 2023-10-18 | Discord, 서비스 종료 발표("가파른 사용자 감소"를 사유로 명시) | TechCrunch |
| 2023-11-07 | 서비스 완전 종료 | TechCrunch, Wikipedia |

**해석**: Discord가 인수한 시점(2023-01)에 Gas는 이미 다운로드 기준으로 거의 죽어 있는 앱이었다. 이는 기존 `community/INSIGHTS.md`가 인용한 "TechCrunch 보도의 Discord 내부 메모(제품보다 엔지니어링 팀 확보 목적)"와 정확히 앞뒤가 맞는다 — Discord가 "제품으로서" 인수하지 않은 이유는 이미 제품이 죽어가고 있다는 걸 알았기 때문일 가능성이 높다.

**중요한 한계**: 위 수치는 모두 **신규 다운로드(설치)** 지표다. 기존 가입자의 일일활성(DAU) 리텐션 곡선(코호트별 D7/D30 등)은 42matters·Sensor Tower 공개 글에서 찾지 못했다 — **미수집**. 다만 (a) 앱스토어 랭킹 붕괴(Lifestyle 82위)와 (b) 커뮤니티에서 나온 실사용자 발언("죽은 줄 알았다")이 시기적으로 일치한다는 점은 "신규 유입만 줄고 기존 유저는 계속 쓰고 있었다"는 대안 가설과는 배치되며, 다운로드 붕괴가 실사용 붕괴와 동행했음을 간접적으로 뒷받침한다.

Sources: [Gas Downloads Drop 98% Following Discord Acquisition — 42matters](https://42matters.com/blog/?p=gas-downloads-down-98-following-discord-acquisition) · [MMM: Discord Acquires Gas, 3M Active Users — Sensor Tower](https://sensortower.com/blog/monday-mobile-memo-2023-01-23) · [Gas (app) — Wikipedia](https://en.wikipedia.org/wiki/Gas_(app)) · [Discord acquires Gas — TechCrunch](https://techcrunch.com/2023/01/17/discord-acquires-gas-a-compliments-based-social-media-app-for-teens/) · [Discord kills Gas — TechCrunch](https://techcrunch.com/2023/10/19/discord-kills-gas-anonymous-compliments-app-bought-nine-months-ago/)

---

## 2. 원인 후보 A — 별개의 신뢰 충격: 2022-10 인신매매 괴담

기존 리서치에는 이 사건이 전혀 언급되지 않았다. 이번 조사로 새로 확인:

- **발원**: 2022-10-05, 중국발 유저 1명의 리뷰에서 시작 → 미국 10대 팔로워가 거의 없는 TikTok 계정들이 확산시킴("white van이 앱 다운로드한 사람을 따라다닌다"는 식의 괴담).
- **확산 규모**: 오클라호마·경찰서·학교 단위로 공식 경고문이 나갈 정도로 커짐(이후 철회). 전문가·Polaris(인신매매 대응 비영리단체)는 "앱이 위치 정보를 수집하지 않고 메시징 기능 자체가 없어 구조적으로 불가능"이라며 반박.
- **실측 피해**: **다운로드 2주간 정체 + 단일일 기준 유저의 3%가 앱 삭제**, 평점·매출 동반 하락, 4인 개발팀이 살해 협박을 받음.
- **타이밍**: 다운로드 피크(11/10)보다 5주 이상 앞서 시작 → 즉 "추수감사절 붕괴"는 이미 신뢰가 한 차례 훼손된 상태 위에서 벌어졌다.

**시사점**: 이 사건은 순수한 "K-factor 수학적 소진"이나 "호기심 소진"과는 다른, **외부 충격형(exogenous shock) 신뢰 붕괴**다. 익명 소셜 앱은 이런 유형의 도덕적 공황(moral panic)에 구조적으로 취약하다 — 익명성 자체가 최악의 시나리오를 상상하게 만드는 재료가 되기 때문. "오늘 해볼까"는 대상이 성인이고 투표 내용이 "칭찬/호감"이 아니라 "아이디어 유효성"이라 소재는 다르지만, "익명 투표"라는 형식 자체가 갖는 사회적 신뢰 리스크는 참고할 필요가 있다.

Sources: [Gas (app) — Wikipedia](https://en.wikipedia.org/wiki/Gas_(app)) · [No, the Gas app is not for human trafficking — Washington Post](https://www.washingtonpost.com/technology/2022/11/09/debunking-gap-app-sex-trafficking-rumor/) · [Fact Check: Gas App NOT Used By Sex Traffickers — Lead Stories](https://leadstories.com/hoax-alert/2022/11/fact-check-gas-app-not-used-by-sex-traffickers-to-kidnap-ensnare-kids.html)

---

## 3. 원인 후보 B — 구조적 K-factor 붕괴: "학교 그래프 포화"보다 먼저 "나이-초대 감쇠"

갭에서 제시한 두 가설 중 하나("학교 단위 초대 그래프가 포화되면 K-factor가 구조적으로 0에 수렴하는지")를 검증하기 위해 창업자 Nikita Bier 본인의 발언을 확보했다(Lenny's Podcast 트랜스크립트, GitHub 미러):

> **"for every social app I've ever built[,] the number of invitations sent per user drops 20% for every additional year of age from 13 to 18."**
> "The number of people you text is growing up until about 21, and then it just falls, it collapses, and then it comes back up at end of life."
> ("내가 만든 모든 소셜 앱에서, 나이가 13세에서 18세로 한 살씩 올라갈 때마다 유저당 초대 발송 수가 20%씩 떨어진다." / "문자를 주고받는 사람 수는 21세 무렵까지 늘다가 그 이후 급격히 무너진다.")

이건 "학교별 그래프가 다 채워져서" 생기는 **정적(static) 포화**가 아니라, **유저 개개인이 나이 들면서 새로 초대할 유인 자체가 구조적으로 줄어드는 동적(dynamic) 감쇠**다. Bier는 이를 이유로 자신이 의도적으로 13~14세(중학교~고1)를 첫 타겟으로 삼는다고 설명한다 — 타겟을 좁게, 어리게 잡아야 초대 발송량이 최대인 구간을 잡을 수 있다는 것.

또한 Bier는 "durable(오래가는) 소셜 제품을 만드는 건 10년에 한 번 나오는 black swan 사건"이라고 명시적으로 인정한다:

> **"I think finding durability for a communication or social product, that's a black swan event... There's one every decade. If it was simple, I would just be printing $1 trillion companies."**

**해석**: Bier 본인의 게임 이론상, Gas·tbh류 앱은 애초에 "영구 리텐션"을 노리고 설계된 게 아니라 **짧고 굵은 바이럴 스파이크를 최적화**하도록 설계됐다. 이는 "리서치가 종료 원인을 경영 차원 설명으로만 마무리했다"는 지적과 정확히 반대되는 결론을 시사한다 — Discord의 방치가 원인이 아니라, **제품 자체가 창업자 본인의 인정 하에 태생적으로 유한한 수명을 갖도록 설계됐다.**

Sources: [How to consistently go viral: Nikita Bier's playbook — Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-consistently-go-viral-nikita-bier) · [lennys-podcast-transcripts/nikita-bier — GitHub](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/nikita-bier/transcript.md)

### 3-1. 전작 tbh와의 패턴 반복 — "Discord 탓"이 아니라는 결정적 반증

Bier의 전작 **tbh**(2017년 출시, Facebook에 ~$100M에 인수)도 동일한 곡선을 그렸다: 출시 몇 주 만에 500만 다운로드 → 급격한 사용 감소 → **Facebook이 2018-07-02, "이용률 저조(low usage)"를 사유로 자체 종료**. Gas는 Facebook 대신 Discord가 인수자였을 뿐, "바이럴 스파이크 → 사용률 저조 → 인수사가 철수"라는 시퀀스는 두 개의 서로 다른 회사, 두 개의 서로 다른 인수 시점에서 **정확히 동일하게 반복**됐다. 이는 "Discord가 잘못 관리해서"라는 설명의 반증 사례로, 리텐션 붕괴가 인수사와 무관한 제품/장르 구조적 현상임을 강하게 시사한다.

Sources: [tbh — Wikipedia](https://en.wikipedia.org/wiki/Tbh) · [Facebook shutters the teen app it just bought — CNN](https://money.cnn.com/2018/07/03/technology/facebook-tbh-app-shut-down/index.html)

---

## 4. 원인 후보 C — "누가 날 뽑았는지" 호기심의 1회성 소진 + 신뢰 훼손이 소진을 가속

갭의 두 번째 가설("'누가 날 뽑았는지'라는 1회성 호기심이 반복 노출되며 소진되는 것인지")에 대한 근거:

- **변동보상(variable reward) 메커니즘의 심리학적 전제**: "누가 나를 뽑았는지" 알림은 슬롯머신과 동일한 변동비율 강화(variable-ratio reinforcement) 구조다. 신경과학 연구에 따르면 도파민 반응은 보상 자체보다 **"불확실성이 진짜일 수도 있다"는 예측 오차(prediction error)** 구간에서 더 크게 발생한다. 즉 이 루프가 작동하려면 유저가 "이게 진짜 사람의 반응"이라고 믿어야 한다.
- **그런데 Gas 자체에서 "가짜 답장" 의심이 반복 확인됨** (기존 `community/INSIGHTS.md` 인용: r/teenagers "Gas app fake replies?", "Is 'Gas' Legit"). 카피캣 세대인 **NGL**에서는 이 의심이 실제 규제 조치로 이어졌다 — 2024년 미국 FTC가 NGL을 "가짜 메시지로 유저를 기만하고 미성년자 보호장치가 부실했다"고 제소, **NGL이 $500만에 합의**. 이는 이번 조사에서 새로 확인한 사실이다.
- **함의**: "누가 뽑았는지" 호기심 루프는 (a) 반복 노출만으로도 자연 소진되는 '노벨티 효과(novelty effect)'의 대상이면서, 동시에 (b) **"어차피 봇/조작 아니냐"는 의심이 생기는 순간 예측 오차 자체가 사라져 루프가 통째로 무력화**된다. 두 힘이 같은 방향(이탈)으로 작용하며 서로를 가속시킨다 — Gas의 경우 (2)의 "가짜 답장 의심"이 (1)의 자연 소진보다 먼저, 더 급격하게 작동했을 가능성이 높다(인신매매 괴담과 겹치는 신뢰 훼손 국면과 시기적으로 근접).

Sources: [The Strings: How Social Media Uses Variable Rewards — Magnify Mind](https://magnifymind.com/social-media-uses-variable-rewards/) · [Social media copies gambling methods — University of Michigan IHPI](https://ihpi.umich.edu/news/social-media-copies-gambling-methods-create-psychological-cravings) · [NGL(SNS) — 나무위키](https://namu.wiki/w/NGL(SNS)) (FTC $5M 합의 관련 요약 인용, 1차 출처는 FTC 보도자료이나 이번 조사에서는 나무위키 경유로만 확인 — **부분 미수집**, FTC 원문 보도자료는 별도 확인 못 함)

---

## 5. 장르 전체 패턴 — Gas만의 문제가 아니라 "익명/일회성 호기심 소셜 앱" 장르의 구조적 결함

동일 장르(10대 대상 익명 소셜)의 반복된 생애주기를 확인했다:

| 앱 | 정점 | 종료/쇠퇴 사유 |
|---|---|---|
| **Yik Yak** (2013) | 2015년 400만 유저, $73.5M 투자 유치 | 사이버불링·괴롭힘 스캔들 반복 → 2017-04 자체 종료 |
| **Secret / Sarahah** (2017) | 6,200만 유저(Sarahah) | 사이버불링 남용, 앱스토어 퇴출 압박 |
| **Yo** (2014) | 4일 만에 100만 다운로드 | 창업자 본인이 "leaky bucket"(새는 양동이)이라 자평 — 대량 유입에도 리텐션이 애초에 없어 2016년 사실상 방치·종료 |
| **BeReal** (2022) | 2022-10 정점(2,000만+ DAU) | "노벨티 없이는 유틸리티도 없다"는 평 — 6개월 지나며 노벨티 소진, 2023년 다운로드 감소 시작(단, BeReal은 2023-09 기준 자체적으로 "2,500만 DAU"라 반박하며 감소설에 이견 존재) |
| **Gas** (2022) | 2022-11-10 정점(12.4만 다운로드/일) | 위 표 참고 |

공통 패턴: **핵심 루프가 단 하나(단일 메커닉)이고, 그 메커닉의 재미가 "새로움" 자체에서 나오는 앱들은 예외 없이 급성장 후 급격 쇠퇴를 겪는다.** Yo 창업자의 표현을 빌리면 "growth를 고치기 전에 retention 누수부터 막았어야 했다"는 사후 반성이 장르 전반에 반복된다.

Sources: [Why did Yik Yak shut down — Tactyqal](https://tactyqal.com/blog/why-yik-yak-the-anonymous-social-media-app-failed/) · [The lessons I learned after shutting down my viral app, Yo — Product Hunt](https://www.producthunt.com/stories/the-lessons-i-learned-after-shutting-down-my-viral-app-yo) · [Yo (app) — Wikipedia](https://en.wikipedia.org/wiki/Yo_(app)) · [Novelty Without Iteration: Why User Fatigue Led to the Downfall of BeReal — Medium](https://medium.com/@avafonss/novelty-without-iteration-how-user-fatigue-led-to-the-downfall-of-bereal-697ba1ef37cc) · [BeReal pushes back at report that it's losing steam — TechCrunch](https://techcrunch.com/2023/09/29/bereal-pushes-back-at-report-that-its-losing-steam-says-it-now-has-25m-daily-users/)

---

## 6. 한국 관점 조사 결과

지시에 따라 한국어 검색어("가스 앱 청소년 익명 투표 논란", "NGL 앱 한국", "가스 앱 인신매매 괴담 한국 보도", "가스 앱 사용자 이탈")로 별도 조사했다.

- **한국 매체의 Gas 보도는 대부분 "소개/분석" 성격이지, "논란"을 다룬 기사는 발견하지 못했다.** 한경, 애틀러스리서치, cwn.kr 등의 기사는 Gas의 성장 스토리·BM(God Mode)·성장전략을 소개하는 톤이며, 인신매매 괴담이나 사용자 이탈을 다룬 한국어 기사는 검색되지 않음 — **미수집(사유: 한국은 Gas 서비스 지역이 아니었기 때문에 국내 언론이 스타트업/마케팅 사례 관점으로만 다뤘고, 미국 현지 논란은 별도로 보도되지 않은 것으로 추정)**.
- **NGL(카피캣, 한국에서도 서비스됨)에 대해서는 실제 한국 유저 반응을 확인**: Threads·블로그에서 "봇으로 추정되는 계정이 집착하듯 질문을 반복해 앱을 지웠다"는 경험담, "번역기(파파고) 말투의 어색한 한국어 질문 약 10건을 받고 사기로 의심했다"는 반응, "누가 보냈는지 확인해준다는 유료 구독(9,900원)의 신뢰성에 의문"이라는 반응을 확인 — Gas의 "가짜 답장 의심"과 **동일한 신뢰 붕괴 패턴이 한국 유저 사이에서도 재현**됨을 확인했다(카피캣 세대·다른 국가에서도 같은 실패 모드가 반복된다는 교차 증거).
- **NGL 미국 FTC 제재($5M 합의, 2024)**는 이번 조사에서 새로 확인(3-C 참고).

Sources: [칭찬 투표 중심 커뮤니티 GAS의 성장과 인수 — Disquiet](https://disquiet.io/@woojungkim/makerlog/5773) · [[스냅샷] Gas — 애틀러스리서치앤컨설팅](http://www.arg.co.kr/news/articleView.html?idxno=87315) · [미국 청소년, 학우 칭찬하는 착한 SNS 앱 '가스'에 열광 — cwn.kr](https://cwn.kr/article/179565040506849) · [Threads 사용자 경험담(@im_ddu1007)](https://www.threads.com/@im_ddu1007/post/DXfF6lkAYcv/) · [NGL 인스타그램 익명 봇 질문 보는법 — 이슈위키](https://t.winkyblacky.com/220)

---

## 7. "오늘 해볼까"에 대한 설계 시사점 (가설, 검증 필요)

1. **카드 공개(뒤집기) UX는 Gas·NGL과 동일한 변동보상 슬롯머신 구조다.** 이 루프의 힘은 "결과가 진짜"라는 믿음에서 나온다 — 만약 향후 AI 생성 콘텐츠나 자동 리믹스가 "사람이 실제로 투표/반응한 것"으로 오인되게 설계된다면(의도치 않더라도), Gas·NGL이 겪은 "가짜 답장 의심 → 신뢰 붕괴 → 이탈 가속" 경로를 그대로 밟을 위험이 있다. **투표자/반응이 실제 사람인지 여부를 유저가 구분할 수 있게 하는 것**이 리텐션 방어에 직결된다.
2. **초대 기반 바이럴(K-factor)은 시간이 지날수록 구조적으로 감쇠한다** — Gas의 "나이 들수록 초대 20%씩 감소" 데이터처럼, 성인 대상 "오늘 해볼까"도 "이미 물어볼 만한 지인에게 다 물어본" 시점 이후에는 초대 루프만으로 재방문을 만들 수 없다. **핵심 가치(코어 루프)가 "지인 반응 확인"이라는 1회성 스릴 바깥에도 존재해야 한다** — 이미 확정된 설계 원칙("상세·추가 기능에서 결제")이 이 리스크에 대한 부분적 방어이긴 하나, 결제 여부와 무관하게 "지인 응답을 다 받은 뒤에도 돌아올 이유"를 코어 루프 자체에 설계해야 함(예: 새로운 씨앗/조합이 계속 갱신되는 콘텐츠형 재미, 실행 자체의 진행 상황 추적 등).
3. **런칭 초기 급성장이 있더라도 "죽었다는 인식"은 실제 종료보다 훨씬 먼저, 조용히 찾아온다** — Gas 사례에서 다운로드 붕괴는 인수 발표 8주 전에 시작됐고 커뮤니티에서 "그거 벌써 죽은 줄 알았어"라는 인식이 공식 종료 10개월 전에 이미 형성돼 있었다. **다운로드/신규가입 지표만 보면 이 신호를 놓친다** — D7/D30 리텐션, 재방문 간격, "이미 아는 사람 다 초대했는가" 같은 그래프 포화도 지표를 런칭 직후부터 추적해야 조기 경보가 가능하다.
4. **익명/투표 기반 서비스는 도덕적 공황(moral panic)형 신뢰 충격에 취약**하다는 점도 별도 리스크로 관리할 필요 — Gas의 인신매매 괴담처럼 근거 없는 루머라도 확산되면 실질적 이탈(단일일 3%)로 이어진다. 사실무근 루머에 대한 신속 대응 채널(공식 계정, 팩트체크 대응)을 사전에 준비해두는 것이 좋다.

---

## 미수집 항목 (확인 실패 · 사유 명시)

- **Gas의 코호트별 DAU/D7/D30 리텐션 곡선**: 42matters·Sensor Tower 공개 블로그에는 다운로드·MAU 스냅샷만 있고 리텐션 곡선 원자료는 없음. Sensor Tower·data.ai(현 Sensor Tower) 유료 리포트에는 있을 가능성이 높으나 이번 조사(WebSearch/WebFetch)로는 접근 불가.
- **Discord 인수 이후(2023-Q1~Q3) Gas의 MAU 추이**: 2022-12 시점 "약 300만 MAU" 스냅샷 외에 이후 분기별 수치는 공개 자료에서 확인 못 함.
- **Reddit에서 "지겨워졌다/질렸다"류 실사용자 발언 신규 확보**: WebSearch의 reddit.com 크롤링 차단(API Error 400) + 이 세션에 `rdt-cli` 미탑재로 실행 불가. 기존 `community/INSIGHTS.md`가 확보한 2023-01 발언("thought that app died ages ago") 이상의 신규 인용을 추가하지 못함.
- **NGL FTC $500만 합의의 1차 출처(FTC 보도자료/합의문) 직접 확인**: 나무위키 경유 요약만 확인, FTC 사이트 원문은 이번 조사에서 별도로 fetch하지 못함.
- **한국 언론의 Gas "논란"(괴담·이탈) 직접 보도**: 검색된 한국어 기사는 전부 소개/분석 톤이며 논란을 다룬 기사를 찾지 못함 — 국내 서비스 미출시로 인해 애초에 논란이 국내에 보도될 유인이 적었을 가능성.
- **BeReal 다운로드 감소를 둘러싼 상반된 주장(제3자 보고서 vs BeReal 자체 반박 "2,500만 DAU")의 사실관계 재정산**: 이번 조사는 장르 패턴 예시로만 인용했고, 어느 쪽 수치가 맞는지 별도 검증은 하지 않음.
