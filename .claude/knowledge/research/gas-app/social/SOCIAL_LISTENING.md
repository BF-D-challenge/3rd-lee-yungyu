# Gas 앱 소셜 리스닝 (Twitter/X)

> 조사 도구: `twitter-cli`(인증 완료) + 보조 WebSearch. 조사일 2026-07-08.
> Gas는 Nikita Bier가 2022년 10월 출시, 2023-01-17 Discord 인수, 2023-11-07 Discord가 서비스 종료한 익명 칭찬/투표 앱(전작 TBH는 2017년 Facebook에 매각 후 2018년 종료).

## Nikita Bier의 성장 전략 발언

이 절은 `twitter -c search "Gas" --from nikitabier --since 2022-06-01 --until 2023-03-01`으로 수집한 본인 트윗과, 이후 성장 회고 트윗을 시간순으로 정리한 것이다.

1. **친구찾기 시스템에 개발 리소스 90% 투입** — 폴 콘텐츠 자체보다 "누가 내 친구인가"를 알아내는 인프라가 바이럴의 핵심이었다는 직접 증언.
   > "10% of development time went into the Gas app's core polling experience. 90% went into the friendfinder system."
   https://twitter.com/nikitabier/status/1597647848002048000 (2022-11-29)
   - 후속 답글에서 기술 디테일 공개: 연락처 매칭은 "You need to do sampling across phone books to clean names"(전화번호부 샘플링으로 이름 정제), 친구 그래프는 Redis 인메모리 저장("In memory (Redis)"). 본인 스스로를 "friendgineer"라 칭함.
   https://twitter.com/nikitabier/status/1597648796586213377 · https://twitter.com/nikitabier/status/1597653562418294784 · https://twitter.com/nikitabier/status/1597648875430768640

2. **학교 단위 침투 속도 지표** — 바이럴 루프가 한 학교 내에서 얼마나 빨리 포화되는지 정량 공개.
   > "Yeah, the Gas app hits 40-50% penetration per school in 36 hours."
   https://twitter.com/nikitabier/status/1585890762964598785 (2022-10-28)

3. **전국 침투율** — "미국 10대 3명 중 1명이 Gas를 설치했다."
   > "One in three teens have installed the Gas app in the United States."
   https://twitter.com/nikitabier/status/1592763511775850496 (2022-11-16)

4. **멀티터치 밀도 이론** — 신규 앱 획득 전략에 대한 질문에 답하며 "한 사람이 하루에 서로 다른 3곳에서 마케팅 메시지를 봐야 다운로드로 전환된다"는 원칙 공개.
   > "Everything, everywhere all at once. You need density in a concentrated [area]. Typically, a person needs to see your marketing message in 3 different places in one day to be convinced to download."
   https://twitter.com/nikitabier/status/1594096629992214528 (2022-11-19, @MattPRD 질문에 대한 답)

5. **메시징 미지원은 안전+운영효율의 이중 설계** — 폴(투표)만 지원해 어뷰징 처리량을 99.9% 줄였다는 제품 설계 근거.
   > "While not allowing messaging on the Gas app creates a safer experience, part of that was motivated by operational efficiency. When running an app at the scale of 7 million users, there is an abuse/integrity crisis every hour. When it's just polls, you reduce that volume by 99.9%."
   https://twitter.com/nikitabier/status/1594095344794554368 (2022-11-19)

6. **카테고리 포지셔닝 전략** — App Store 랭킹 카테고리를 의도적으로 "Social"로 옮겨 TikTok/Instagram과 정면 경쟁("dethrone the kings")한 사실 공개.
   > "We moved Gas to the Social category today—to dethrone the kings."
   https://twitter.com/nikitabier/status/1580424050655956992 (2022-10-13)
   - 답글에서 다른 창업자(@Korihandy)가 "buy traction approach"(유료 순위 견인)를 자신의 소셜앱(Banana App)에도 썼다고 증언 — 초기 차트 진입을 인위적으로 만드는 것이 업계 관행임을 시사.

7. **본인 커리어 전체를 관통하는 성장 패턴 요약** (TBH→Gas가 "같은 앱을 두 번 파는" 패턴임을 스스로 인정).
   > "My Product Timeline / 2012: Politify - 4 million users / 2014: Five Labs - 5 million users / 2017: tbh - 9 million users / 2022: Gas - 10 million users / 20 flops in between"
   https://twitter.com/nikitabier/status/1620476717537300482 (2023-01-31)

8. **K-factor를 명시적으로 언급한 회고 스레드** (Gas 종료 약 1개월 후, 2023-12-16) — "진짜 바이럴 성장"의 정의와 Gas의 실제 K-factor 수치를 공개. "오늘 해볼까"의 공유 루프 설계에 가장 직접적으로 참고할 만한 발언.
   > "You will only achieve true viral growth when the user is sharing your app's content at a high frequency to other networks. Too many founders will look to add a temporary boost because that's what they see other apps do. I call it Spotify Wrapped syndrome. You might top the charts for a day but that is only going to create phantom validation that something is working. What you really need is the main content in your app's feed to be shareable. TikTok and Instagram didn't grow by adding a growth hack after the fact."
   https://twitter.com/nikitabier/status/1736067506442326102
   >
   > "On the Gas app, when a teen received an anonymous message, their first inclination was to post to Snapchat to ask their friends who sent it to them. So for every message sent on the app, we acquired >1.0 users."
   https://twitter.com/nikitabier/status/1736068442875158867
   - 즉 Gas의 핵심 루프는 "① 익명 메시지 수신 → ② 발신자 궁금증 발생 → ③ 스크린샷을 Snapchat 등 외부 네트워크에 공유해 '누가 보냈는지' 물어봄 → ④ 그 공유 게시물을 본 제3자가 앱을 설치" 였고, 이 스텝의 초대 전환율이 메시지 1건당 신규 유저 1.0명을 넘겼다(K-factor > 1.0)는 것이 성장의 실질 엔진이었다.

9. (참고, 부차적) 위기 대응 발언들 — 성장 급등 직후 발생한 "인신매매 앱" 루머/디도스 공격 대응. 성장 스토리의 그림자로서 기록.
   - "This human trafficking hoax about the Gas app has taken on a life of its own..." https://twitter.com/nikitabier/status/1580852745627529216 (2022-10-14)
   - "After an investigation, our team found several indications that the Gas app 'human trafficking' hoax was planted by an entity or person o[utside the US]..." https://twitter.com/nikitabier/status/1581490395531206656 (2022-10-16)
   - "We get messages daily from users who have reconsidered suicide because of the affirmations they receive..." https://twitter.com/nikitabier/status/1593795329513488384 (2022-11-19, @bramiozo의 "어두운 디자인 패턴으로 10대 불안감을 착취" 비판에 대한 반박)
   - "Averaging 60 support messages per day from users stating Gas helped with their depression and anxiety" https://twitter.com/nikitabier/status/1594055054914646016 (2022-11-19)

## 바이럴 성장 스토리 (지표/스크린샷 언급)

### Luke Sophinos(@lukesophinos)의 그로스 분석 스레드 (2022-11-17, 좋아요 5,763 · RT 894 · 북마크 2,633)
스레드 시작: https://twitter.com/lukesophinos/status/1593268198064824320

전체 흐름(스레드 20+ 트윗 전문 확인, 시간순):
- "전직 Facebook 매니저가 TikTok·Instagram을 제치고 App Store 1위를 찍은 앱을 출시했다. 팀 4명으로 10일 만에 $1M을 벌었다." (모두)
- WSJ가 출시 일주일 만에 "Hottest App right now"라 명명. 당시 12개 주에서만 다운로드 가능했는데도 이 정도 화제성.
- **그로스 해킹 기법 상세**: Instagram에 `gas.georgiahigh` 식으로 고교명을 포함한 비공개 계정을 만들어 해당 학교 전교생을 먼저 팔로우 → 학생들이 동시에 같은 알림을 받고 서로 이야기하기 시작 → 계정 bio를 "see who likes you"로 바꿔 앱 설치 유도.
- **속도 지표**: "시간당 3만 명" 가입("30,000 users PER HOUR. Not per DAY. Not per WEEK.")
- **수익화**: "God Mode" 주당 $6.99(월 환산 $28, Netflix 표준 요금제의 거의 2배)로 누가 나에 대해 투표했는지 열람 가능.
- **위기**: 인신매매 루머 확산 → 경찰/학교/지역뉴스가 학부모에게 사용 자제 권고 → 중국발 IP 다수 포함된 디도스 공격 2건 확인 → 매출 일시 급락 → 이후 루머는 대체로 허위로 판명, "미국 10대 3명 중 1명이 설치"까지 회복.
- 결론부에서 Gas를 "바이럴리티 달성 + 위기를 뚫고 사업을 지속시킨" 케이스 스터디로 요약.

### 회고 인용 트윗 (2026-02-17, 좋아요 3,640 · 조회 366K)
https://twitter.com/karthikponna19/status/2023784251427110963
> "spent 5 years building 14 failed apps... built TBH got 5M users in 9 weeks... $0 spend on marketing, sold it to Facebook for $30M... built Gas, literally the same app... 10M users in 3 months, $0 on ads, sold it to Discord..."
- 주의: 이 트윗은 Gas 종료(2023) 이후 3년 뒤(2026)에 작성된 **후대의 요약/밈성 회고**이며 1차 자료가 아니다. 다만 "TBH 9M유저/9주, Gas 10M유저/3개월, 광고비 $0" 수치는 Nikita 본인의 "Product Timeline" 트윗(위 7번) 및 언론 보도와 방향이 일치한다.

### 보조 WebSearch로 확인한 정량 지표 (Twitter 밖 출처, 상호 검증용)
- Gas는 출시 후 열흘 만에 DAU 100만 명 달성, 2022년 12월까지 누적 매출 $5M로 보도됨(Synergy Labs 블로그, Medium 등 2차 자료 종합).
- Lenny's Newsletter 인터뷰 "How to consistently go viral: Nikita Bier's playbook for winning at consumer apps" — TBH·Gas의 그로스 철학을 다룬 1차 인터뷰. https://www.lennysnewsletter.com/p/how-to-consistently-go-viral-nikita-bier (직접 조회는 못했고 검색 스니펫만 확인 — 상세 인용은 미수집)

## 일반 사용자 반응

인수 발표 트윗(https://twitter.com/nikitabier/status/1615444742296436737, 2023-01-17)에 달린 반응 및 동시기 뉴스 계정 반응:

- **Gergely Orosz**(@GergelyOrosz, 좋아요 3,394): "This is next level. Nikita: built an app called tbh where teens could compliment each other, anonymously. Facebook bought the app and shut it down. Nikita vested out, then built an app called Gas where teens could compliment each other, anonymously. Discord bought the app and…" — TBH→Gas 패턴을 최초로 대중적으로 지적한 인용 트윗. https://twitter.com/GergelyOrosz/status/1615446260273774592
- **The Verge**(@tomwarren): "Discord is acquiring Gas, the popular app for teens to compliment each other. The Gas team will join Discord and the app will remain standalone for now." https://twitter.com/tomwarren/status/1615443247454642201
- **Dexerto**(뉴스 계정, 좋아요 2,897): "Discord acquired new app 'Gas' teens use to anonymously compliment each other" https://twitter.com/Dexerto/status/1615444525740089346
- **Chris Bakke**(@ChrisJBakke, 유머): "'Discord?! We lost this deal to Gen Z Slack? Okay. Okay. No, I'm fine. Okay. Yeah, get Susan to draft an offer for $50B to Discord. I'll sign today.'" https://twitter.com/ChrisJBakke/status/1615449359667318785
- **Eren Bali**(Udemy 창업자, @erenbali): "Congrats man. Big W to sell your company before you run out of startup AWS credits." https://twitter.com/erenbali/status/1615555472148561920
- **Discord 공식 계정**의 축하 답글: "⛽️🫡" https://twitter.com/discord/status/1615472959518539777
- **비판적 반응**: @bramiozo — "It is literally the monetisation of insecurity among adolescents. It uses dark design patterns [to] force engagement." https://twitter.com/bramiozo/status/1593602874726047748 (이에 대한 Nikita의 반박은 위 "위기 대응 발언" 참고)
- **동종업계 창업자의 공감**: @Korihandy — "I love the buy traction approach.. good kick starter for social apps.. I did this years ago with Banana App, paid $10k landed in top app for social for the week, and landed in top 50 apps.. great investment.. helped 나 raise another $1M" https://twitter.com/Korihandy/status/1580709709195415554
- **종료 시점 반응** (2023-10-18~20): @matousekmark — "Discord is shutting down Gas, the anonymous compliments app it acquired in January. Discord CEO Jason Citron told employees the company…" https://twitter.com/matousekmark/status/1714742829728116894 · @austinpengg — "2018: 'Facebook is shutting down TBH, a teen app it bought eight months ago' / 2023: 'Discord kills Gas, the anonymous compliments app it…'" (동일 인수-종료 패턴 반복 지적) https://twitter.com/austinpengg/status/1715384287761985735

## 출처 목록

Twitter/X (1차, twitter-cli로 직접 수집):
- https://twitter.com/nikitabier/status/1615444742296436737 — Gas의 Discord 인수 발표
- https://twitter.com/nikitabier/status/1597647848002048000 (+ 답글 스레드) — 친구찾기 시스템 90% 개발 리소스, Redis 친구그래프, 전화번호부 샘플링
- https://twitter.com/nikitabier/status/1585890762964598785 — 학교당 36시간 내 40-50% 침투율
- https://twitter.com/nikitabier/status/1592763511775850496 — 미국 10대 3명 중 1명 설치
- https://twitter.com/nikitabier/status/1594096629992214528 — 하루 3곳 노출 다운로드 전환 이론
- https://twitter.com/nikitabier/status/1594095344794554368 — 메시징 미지원=안전+운영효율
- https://twitter.com/nikitabier/status/1580424050655956992 — Social 카테고리 이동("dethrone the kings")
- https://twitter.com/nikitabier/status/1620476717537300482 — 본인 커리어 전체 Product Timeline
- https://twitter.com/nikitabier/status/1736067506442326102 — "Spotify Wrapped syndrome"/진짜 바이럴 성장론
- https://twitter.com/nikitabier/status/1736068442875158867 — Gas 메시지 1건당 유저 획득 >1.0 (K-factor)
- https://twitter.com/nikitabier/status/1580852745627529216 , /1581490395531206656 , /1593795329513488384 , /1594055054914646016 — 인신매매 루머 위기 대응
- https://twitter.com/nikitabier/status/1612837714432491521 — Today Show 방영 언급
- https://twitter.com/nikitabier/status/1595281780029825024 — 캐나다 확장
- https://twitter.com/lukesophinos/status/1593268198064824320 (스레드 전체) — App Store 1위·시간당 3만가입·Instagram 시딩 기법·God Mode 수익화·위기 상세 분석
- https://twitter.com/GergelyOrosz/status/1615446260273774592 — TBH→Gas 반복 패턴 지적
- https://twitter.com/tomwarren/status/1615443247454642201 — The Verge 인수 보도
- https://twitter.com/Dexerto/status/1615444525740089346 — 뉴스 계정 보도
- https://twitter.com/ChrisJBakke/status/1615449359667318785 , https://twitter.com/erenbali/status/1615555472148561920 , https://twitter.com/discord/status/1615472959518539777 — 인수 발표 반응
- https://twitter.com/bramiozo/status/1593602874726047748 — 다크패턴 비판
- https://twitter.com/Korihandy/status/1580709709195415554 — 유료 트랙션 매수 관행 증언
- https://twitter.com/matousekmark/status/1714742829728116894 , https://twitter.com/austinpengg/status/1715384287761985735 — 서비스 종료 반응
- https://twitter.com/karthikponna19/status/2023784251427110963 — 2026년 시점 후대 회고 요약(2차성 주의)

보조 WebSearch (Twitter 밖, 상호검증용 — 본문 링크 미방문, 스니펫만 확인):
- https://www.lennysnewsletter.com/p/how-to-consistently-go-viral-nikita-bier
- https://www.synergylabs.co/blog/how-nikita-bier-built-two-viral-apps-without-spending-a-dollar-on-marketing
- https://medium.com/@illyism/how-to-build-successful-social-apps-lessons-from-nikita-bier-creator-of-tbh-and-gas-11c564ece467

미수집(사유):
- `twitter -c search "Gas app"` / `"gas app discord"` 단순 검색 — 최신순 정렬로 인해 2026년 현재 시점의 무관한 "gas station 앱" 트윗들이 대부분 반환되어 신호 대비 잡음비가 낮았음. `--from nikitabier`, `--since/--until` 날짜 필터를 추가한 타겟 검색으로 대체해 목표를 달성함(위 항목들).
- `"Gas app store number 1"`, `"Gas app growth loop"`, `"Gas k-factor viral"` 등 자연어 구문 검색 — GraphQL 검색이 구문을 AND/exact-phrase가 아닌 개별 키워드로 느슨하게 처리하는 것으로 보여 무관 결과(가스요금, 게임 용어 등)만 반환됨. `pipx upgrade twitter-cli` 재시도는 생략(날짜 필터 검색으로 이미 목표 데이터 확보했으므로 불필요 판단). 대신 WebSearch로 "K-factor" 관련 정보를 보완 수집함.
- Lenny's Newsletter 인터뷰 전문 — WebSearch 스니펫에서 K-factor/성장 철학 언급을 확인했으나 원문 페이지는 WebFetch로 조회하지 않음(과제 범위가 Twitter 중심이라 판단, 필요시 추가 조회 가능).
