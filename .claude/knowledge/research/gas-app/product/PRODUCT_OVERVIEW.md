# Gas 앱 제품 개요

## 한 줄 요약

Gas는 "친구에 대한 익명 4지선다 폴에 답하면, 뽑힌 친구가 익명 칭찬 알림('불꽃')을 받는" 구조의 10대 대상 소셜 앱이다. Nikita Bier(전작 tbh, 2017년 Facebook에 매각)가 만들었고, 2022년 8월 출시 → 3개월 만에 1,000만 사용자 → 2023년 1월 Discord 인수 → 2023년 11월 Discord가 종료했다.

## 타임라인

| 시점 | 사건 |
|------|------|
| (이전작) 2017 | Nikita Bier, tbh 출시 → 9주 만에 500만 다운로드 → Facebook에 인수(약 $30M) |
| 2022-08-29 | Gas 출시 (이전 코드네임: Melt, Crush). 공동창업자: Nikita Bier, Isaiah Turner, Dave Schatz, Michael Gutierrez |
| 2022-10 | Apple App Store 최다 다운로드 앱 1위 (TikTok, BeReal 제침) |
| 2022-11 초 | 누적 510만 다운로드, DAU 100만, 일일 신규 30만 다운로드 |
| 2022-11 | (3개월 시점) 누적 1,000만 사용자 |
| 2023-01-17 | Discord가 Gas 인수 (금액 비공개) |
| 2023-10-18 | Discord, 서비스 종료 발표 |
| 2023-11-07 | 앱 완전 종료 ("가파른 사용자 수 감소"를 사유로 명시) |

## 핵심 루프 (게임 메커닉)

1. **폴 응답**: 홈 화면에 "Best person to go camping with" 같은 질문 + 친구 목록에서 뽑은 4명의 선택지가 뜬다. 사용자는 12개 폴을 연속으로 스와이프하며 답한다(셔플/스킵 가능).
2. **익명 알림('불꽃')**: 누군가 폴에서 나를 선택하면, 나는 "A girl gassed you up" 같은 익명 푸시 알림 + 인박스 메시지를 받는다. 누가 보냈는지는 기본적으로 비공개.
3. **쿨다운 + 초대로 우회**: 12개 폴을 다 풀면 "Play Again"이 60분 잠금(`New Polls in 59:45`)에 걸린다. **"Skip the wait" → "Invite a friend"** 버튼으로 대기시간을 즉시 스킵할 수 있다 — 이것이 초대 바이럴 루프의 핵심 트리거.
4. **친구 추가**: 학교 소속(From School) 추천, 친구의 친구(Friends of Friends) 추천, 검색, SMS 딥링크(`https://{school}.gasapp.co/add/{username}`) 세 가지 경로로 친구를 늘린다. 문자에는 "This new app just came out for {학교명}" 같은 초안이 자동 채워진다.
5. **수익화(코인/젬 + 구독)**:
   - 폴에 답해서 **코인(젬)을 벌고**, 코인으로 "내 이름을 랜덤 폴 3개에 노출"(100코인), "짝사랑 상대 폴에 내 이름 몰래 넣기"(300코인) 같은 **부스트 아이템**을 구매한다.
   - **God Mode**: **$6.99/week(주간 자동갱신 구독, 월 환산 약 $28 — Netflix 표준 요금제의 거의 2배)**로 "누가 나를 뽑았는지" 힌트를 제공. Gas의 유일한 실질적 유료 전환 포인트였다. (2026-07-08 Workflow 사실검증으로 주간 구독임을 확정 — Appfigures·NextBigWhat 1차 인용 교차확인. 최종 100% 확정을 위한 결제화면 스크린샷까지는 확보하지 못함)

## 성장 전략 (Bier의 플레이북)

- **Geofenced exclusivity(지역 제한 독점 전개)**: 학교 단위로 개별 Instagram 계정을 만들어 "You're invited to Gas at {School}. Stay tuned"로 티징하다가, 하교 시간에 일제히 다운로드 링크를 공개. 이후 주(state) 단위로 순차 확대. → 아직 못 받은 학교 학생들에게 FOMO를 만들어 입소문이 학교 경계를 넘어 퍼지게 함.
- **가입 즉시 또래 압력 노출**: 온보딩에서 학교/학년을 먼저 물어 같은 학교 학생 목록을 바로 보여주므로, 가입 직후부터 "내가 아는 얼굴"이 앱 안에 있다는 실재감을 준다.
- **니치에 올인**: 범용 소셜이 아니라 "10대의 사회적 인정 욕구"라는 좁고 강한 니치에 집중.
- **광고비 $0**: 두 앱 모두 유료 마케팅 없이 순수 입소문/초대 루프만으로 확산.

## Discord 인수 후 종료 배경 (요약, 상세는 VOC 문서 참고)

- 공식 사유는 "사용자 수의 가파른 감소". Discord의 코어(게이머 커뮤니티) 오디언스와 Gas의 10대 타깃 오디언스가 잘 맞지 않았고, 10대 대상 서비스 특유의 안전/모더레이션 비용 부담이 컸다는 것이 업계 분석의 공통된 해석이다(상세 출처는 `../voc/SAFETY_AND_REVIEWS.md` 참고).

## 오늘 해볼까 관점에서 눈여겨볼 점 (가설, SUMMARY에서 종합)

- "대기시간 잠금 + 초대로 스킵"은 K-factor를 강제로 만드는 매우 노골적인 장치 — 우리 프로젝트가 "투표 수신자에게 로그인 요구 금지" 원칙과 어떻게 공존시킬지 참고할 사례.
- 무료 코어 루프(폴 답하기) + 단일 유료 훅(God Mode 리빌)이라는 구조는 "기본 기능 무료, 상세/리빌에서 결제"라는 우리 설계 원칙과 정확히 같은 패턴.
- 코인 이코노미가 "누구 폴에 내 이름 넣기"처럼 **조작 가능한 사회적 신호**를 팔았다는 점은 VOC/규제 리스크(NGL FTC 사례와 함께)와 직결 — 상세는 `../voc/SAFETY_AND_REVIEWS.md`.

## 출처
- [Gas (app) — Wikipedia](https://en.wikipedia.org/wiki/Gas_(app))
- [Discord acquires Gas, a compliments-based social media app for teens — TechCrunch](https://techcrunch.com/2023/01/17/discord-acquires-gas-a-compliments-based-social-media-app-for-teens/)
- [Discord kills Gas, the anonymous compliments app it bought nine months ago — TechCrunch](https://techcrunch.com/2023/10/19/discord-kills-gas-anonymous-compliments-app-bought-nine-months-ago/)
- [How to consistently go viral: Nikita Bier's playbook — Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-consistently-go-viral-nikita-bier)
- [How Nikita Bier Built Two Viral Apps Without Spending a Dollar on Marketing — Synergy Labs](https://www.synergylabs.co/blog/how-nikita-bier-built-two-viral-apps-without-spending-a-dollar-on-marketing)
- Mobbin 실제 UI 캡처 (앱 자체가 1차 출처) — 상세는 `../mobbin/FLOWS.md`
