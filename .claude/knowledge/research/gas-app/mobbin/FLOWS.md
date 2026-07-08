# Gas 앱 Mobbin 플로우 분석 (iOS)

mobbin-mcp `search_flows`/`search_screens`로 실제 앱 UI 캡처를 수집·확인한 기록. 스크린샷은 각 링크에서 확인 가능(Mobbin 아카이브 — Gas는 2023-11 종료되어 실제 스토어에는 없음).

## 1. 온보딩 (계정 생성)

**플로우**: [Onboarding (22 screens)](https://mobbin.com/flows/4eba4f5a-1b12-4aa8-b06a-7f4b6867e52b) · [Logging in (24 screens)](https://mobbin.com/flows/8a60f2c4-db6e-4ef5-8181-4a370c71d31a)

순서: 스플래시(GAS 로고) → **학교 검색**("Pick your school", 실시간 검색 결과에 학교별 현재 회원 수 뱃지 노출 — 예: "Martinsburg High School · 824 members") → **학년 선택**("What grade are you in?" Grade 9~12는 "Class of 20XX" 졸업연도로 재표기, "Not in High School"/"Finished High School" 옵션도 존재) → **전화번호 인증** → **이름 입력**(Contacts에서 자동 임포트되는 first name, last name은 수동 입력) → **프로필 사진**(Photo Library/Camera 액션시트, Skip 가능) → **알림 권한 프라이밍 화면**("GAS WORKS BEST WITH NOTIFICATIONS ON" 커스텀 화면을 먼저 보여준 뒤 iOS 시스템 권한 팝업 노출) → 친구 추가 단계로 진입.

**주목할 점**:
- 학교 검색 결과에 회원 수를 노출해 가입 전부터 "이미 이만큼 모였다"는 사회적 증거(social proof)를 보여준다.
- 학년을 "Class of 2026" 식 졸업연도로 병기해 또래 집단 정체성을 즉시 확인시킨다.
- 시스템 알림 권한 요청 전에 자체 프라이밍 화면을 넣는 것은 iOS 앱에서 표준적인 권한 수락률 개선 패턴 — Gas는 이 패턴을 초대 알림(핵심 리텐션 훅)의 도달률을 높이는 데 그대로 활용.

## 2. 홈 / 폴 응답 루프

**플로우**: [Home](https://mobbin.com/flows/e05d99ab-78d6-4240-ac39-935f6f6162dc) · [Completing first Gas poll & cashing out rewards](https://mobbin.com/flows/1836c800-2eb5-4bb9-a86e-402aaac883ff)

한 세션에 **12개 폴을 연속 진행**("1 of 12" ~ "12 of 12" 카운터). 각 폴은 질문마다 다른 배경색+아이콘 테마(캠핑 텐트=올리브, 마법사 모자="Total Slytherin"=파랑, 웃는 이모지="Smiling 24/7"=청록)로 시각적 다양성을 줌. 화면 구성은 질문 텍스트 + 4명의 친구 이름 버튼(2x2 그리드) + 하단 **Shuffle**(선택지 재섞기)/**Skip**(건너뛰기) 버튼. 마지막 문항에서는 이미 답한 선택지에 부분 채움 바(진행률 느낌)가 보이고 "Tap to continue"로 마무리.

12개를 다 풀면 **"Play Again" 잠금 화면**이 뜬다: 자물쇠 아이콘 + "New Polls in 59:45" 카운트다운 + "OR" 구분선 + "Skip the wait" 라벨 + 흰색 알약 버튼 "✉️ Invite a friend" (하단에 장식용 하트 일러스트). 카운트다운이 00:00이 되어도 동일 화면이 유지되는 변형도 확인됨.

**주목할 점**: 이 화면이 Gas 바이럴 루프의 심장부다. **"기다리거나, 초대해서 즉시 풀거나"**라는 이지선다를 코어 루프 직후(가장 몰입도 높은 시점)에 배치해 초대 전환율을 극대화한다.

## 3. 친구 초대 (invite-to-skip) 루프

**플로우**: [Inviting friends](https://mobbin.com/flows/697d496a-2f0b-4c8e-9295-21ef6c2b8b69) · [Adding profile photo & inviting friends](https://mobbin.com/flows/e18ab0f7-b5a7-4320-be0c-cb0d262fa71a) · [Searching Add+](https://mobbin.com/flows/1a40876c-b9c7-4cc7-bb35-e17642f83835)

"Invite a friend" 탭 → **"Select a friend to skip the wait"**(오렌지 풀블리드 배경, 검색창 + 이미 Gas에 있는 친구 목록에 "N friends on Gas" 카운트 병기) → 친구 선택 시 **iOS 네이티브 SMS 작성창**이 열리며 문자 내용이 자동 완성됨: `https://{school}.gasapp.co/add/{username}` 링크 + "This new app just came out for {학교명}" 문구.

별도로 **Add+ 탭**(친구 추가 전용 화면)은 세 그룹으로 구성: "Friends of Friends"(추천), "From School"(같은 학교, Hide/Add 버튼), 그리고 아직 Gas에 없는 연락처 목록에 **"Invitations left: 10/10"** 카운터와 함께 "INVITE" 버튼 노출.

**주목할 점**:
- 학교별 서브도메인 딥링크(`{school}.gasapp.co`)로 발신자의 소속 학교를 URL 자체에 인코딩 — 수신자가 링크만 봐도 "우리 학교 얘기"임을 알 수 있게 설계.
- "Invitations left: 10/10"처럼 **초대 가능 횟수에 상한을 둔 것**은 스팸 방지이자 동시에 "한정된 자원"이라는 희소성 프레이밍이기도 하다.
- 문자 초안이 100% 자동 채워져 사용자가 타이핑 없이 즉시 전송할 수 있게 마찰을 제거.

## 4. 상점(코인) — 유일한 인앱결제 지점

**플로우**: [Boosting name in polls](https://mobbin.com/flows/b8e0b1bd-8c65-4aac-903e-b511ac2b93b0)

다크 테마 모달. 상단에 "YOUR BALANCE" + 코인 수. **"Boost Your Name in Polls"** 섹션에 두 상품:
- "Get Your Name on 3 Random Polls" — 100 코인
- "Put Your Name in Your Crush's Poll — Your name remains secret" — 300 코인

하단 안내: "How do I get more coins? Answer polls about your friends to win coins." (코인은 현금 결제가 아니라 **폴에 답할수록 적립**되는 구조 — 순수 IAP가 아니라 인게이지먼트 재화). 구매 후 "Your name has been added to 3 people's polls." 토스트 확인.

**주목할 점**: 이 상품은 **투표 결과를 돈(코인)으로 조작 가능하게 만든다** — "짝사랑 상대 폴에 몰래 이름 끼워넣기"는 인기 투표의 공정성을 해치는 기능이라 규제·평판 리스크로 이어질 수 있는 지점(`../voc/SAFETY_AND_REVIEWS.md`에서 NGL 사례와 함께 확인).

**미수집**: $6.99 "God Mode"(누가 나를 뽑았는지 힌트를 보여주는 구독형 유료 기능) 화면은 Mobbin 인덱스에 없어 UI를 직접 확인하지 못했다. `search_screens`/`search_flows`로 "God Mode", "premium unlock hints", "subscription paywall" 등을 여러 각도로 검색했으나 매칭되지 않음 — 존재 자체는 웹 출처(TechCrunch 등)로만 확인됨(`../product/PRODUCT_OVERVIEW.md` 참고).

## 5. 인박스 / 알림

**화면**: [첫 인박스 온보딩 오버레이](https://mobbin.com/screens/b3e989e8-3c15-4e5f-b64b-88c5045d1b0a) · [Welcome 마케팅 카드](https://mobbin.com/screens/385a446a-9f0a-4c63-adb5-94cbc70a4978)

최초 진입 시 튜토리얼 오버레이: "This is your inbox / When people pick you, you will get a message here." + 미리보기 알림 카드 "A girl in 9th grade picked you". 실제 인박스 리스트는 불꽃 아이콘 + "From Gas Team ... 6d" 형태로 단순.

**Welcome 카드**(마케팅/온보딩 초입): 좌측 폰 목업 "Answer Polls About Friends"(보라, 폴 UI 썸네일) / 우측 폰 목업 "Get Flames When Picked"(불꽃 이모지 + 토스트 "A girl gassed you up") — 2단계 가치제안을 한 화면에 압축, 하단 "Start" 버튼.

## 6. 프로필 / About

**플로우**: [Profile & About](https://mobbin.com/flows/6dcccb40-b63f-4fe5-8981-acf43f4e1a6a) · [Edit Profile](https://mobbin.com/flows/3703c540-739e-47d2-b4e0-4753de14c09b)

프로필 탭: 아바타 + "0 friends / 0 flames" 통계 행 + "Edit Profile" + 학교/학년 칩(집 아이콘 "LHS", 학사모 아이콘 "12th Grade") + 코인 잔액·Shop 버튼 + 친구 목록(빈 상태 "You have no friends" + CTA "Add Friends"). About 탭에는 How It Works / FAQ / Share Feedback / Get Help / **Safety Center** 메뉴와 Snapchat·Instagram·Twitter·TikTok 소셜 아이콘.

**주목할 점**: About 탭에 **"Safety Center"를 전용 메뉴로 노출**한 것은 10대 대상 익명 소셜 앱에 대한 규제·평판 리스크를 의식한 설계로 보인다(사후에도 종료를 막지는 못했다는 점은 `../voc/SAFETY_AND_REVIEWS.md` 참고).

## 오늘 해볼까에 대한 UX 시사점

- **"쿨다운 잠금 → 초대로 스킵"** 패턴은 이미 우리 프로젝트의 v7 "카드 고정 + 다시 굴리기" 루프와 결이 비슷하다. 다만 우리는 "투표 수신자에게 로그인 요구 금지" 원칙이 있으므로, Gas처럼 스킵 자체를 초대에 강제 결속시키기보다는 **초대를 자연스러운 보너스 경로**로 두는 편이 원칙에 부합한다.
- 딥링크에 **컨텍스트를 인코딩**하는 방식(학교 서브도메인)은 우리도 "이 링크는 누구의 슬롯머신 결과인지"를 URL/오픈그래프에 드러내 클릭률을 높이는 데 참고할 만하다.
- 코인으로 "폴 결과를 조작"하게 한 상점 설계는 **반면교사** — 우리가 결제로 파는 것(수요 리포트, 실행 플랜)은 결과를 조작하는 게 아니라 결과를 더 잘 이해하게 돕는 것이어야 신뢰가 유지된다.
