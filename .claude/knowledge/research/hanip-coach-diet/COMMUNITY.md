# 한입코치 — 커뮤니티 VOC + 영상 트렌드

> 수집일 2026-07-12 · 레딧(rdt CLI)·트위터(twitter CLI)·유튜브(yt-dlp) 수집. 인용은 원문 그대로.

## 1. 레딧 — Cal AI·사진 칼로리 정확도

- **r/loseit "I checked whether 'AI photo calorie tracking' actually works by testing 5 models against my kitchen scale. This stuff doesn't work."** (⬆2,474 · 댓글 206) https://reddit.com/r/loseit/comments/1ug4mar/
  > "The models always know what the food is. They just can't tell how much is on the plate. … Even the best one is about 20% off. … You can't get real 3D portion sizes out of a flat 2D photo."
  - 실측: 최고 모델도 ~20% 오차, 병목은 식별이 아니라 **부피(양) 추정**과 DB 매칭(생/조리 혼동 시 3배 오차).
- **r/loseit "Can't understand why are AI calorie tracker apps so popular?"** (⬆74 · 댓글 124) https://reddit.com/r/loseit/comments/1oqw7ch/
  > "most people don't struggle to eat healthy because they can't count, they struggle because tracking every single bite gets exhausting after a while."
- **r/CoachingSoftware "CalAI just got pulled from the App Store"** (2026-04-16) https://reddit.com/r/CoachingSoftware/comments/1sn4up8/
  > "The moment you introduce a mixed dish, a home-cooked meal, restaurant food… the error rate climbs to 30-40%. … **False precision is arguably more dangerous than admitted uncertainty.** … predominantly trained on Western food datasets."
  - **Cal AI, 위장 결제 UI로 2026-04 앱스토어 퇴출** + 혼합 요리·비서구권 음식(→한식) 오차 더 큼.
- 긍정도 존재: r/loseit 목표 달성 후기 (⬆211) "decent but not perfect… better than nothing if you're eating out" — 기대치는 정확한 숫자가 아니라 대략적 가이드.

## 2. 레딧 — 기록 포기의 실재

- **r/loseit "Can't stick to working out or calorie tracking."** (⬆66 · 댓글 159) https://reddit.com/r/loseit/comments/1ujos92/
  > "I'll be doing well, then I'll have plans with friends, travel, or spend time with family where meal times are unpredictable."
- **r/Zepbound "Anyone else NOT counting calories?"** (⬆535 · 댓글 334): "I know how obsessive I can become. … I would count out grapes… It was unhealthy behavior." — **강박 자기방어형 중단**.
- **r/loseit "I've lost 70 pounds because I stopped counting calories."** (⬆1,564) — "기록을 끊어서 성공" 서사가 대규모 공감.
- **r/loseit "The scale says 200 this morning…"** (⬆3,204): "I need… a reason to hold myself accountable. … I have thrived off of having responsibilities to other people" — 외부 책임 장치 수요.
- r/loseit "I've stopped tracking my calories" (⬆15): 외식 잦아 "consistently tracking is not something that is sustainable for me."

## 3. 레딧 — 빡센 코치/책임감 수요 (핵심 발견)

- **r/loseit "Please bully me into losing this weight"** (⬆347 · 댓글 437) https://reddit.com/r/loseit/comments/1lctaem/
  > "Everyone in my life is accepting… and sabotages me. … I asked for bullying because I wanted tough love and **nobody knows what that is anymore.**"
- **r/loseit "Tough love needed"** (⬆10 · 댓글 50): "I know what I need to do but I'm not doing it." — 지식이 아닌 **집행 수요**.
- r/loseit "…in need of tough love" (⬆102) · "For those that need some tough love..." (⬆690): 단호한 어조 글 자체가 소비됨.
- **r/loseit accountability partner 스레드** (⬆7): "I think a financial commitment will add an additional bit of motivation/accountability" — **유료 책임감 서비스 지불 의사 발화.**

## 4. 레딧 — 안전 이슈 (양방향)

- **r/loseit "Things that helped me that don't involve calorie counting"** (⬆3,272): "I can't calorie count due to disordered eating. This is not up for debate." — ED 이력자에게 칼로리 기록 자체가 금기.
- **r/ClaudeAI 안전필터 과잉 사례** (⬆104): "It stopped answering like I was a person planning a workout and started responding like I was someone in distress." — **안전장치 과잉 발동은 정상 사용자를 모욕해 이탈**시킴. 임계값 설계가 제품 품질 이슈.
- r/loseit (⬆1,099): "calorie counting CAN be a gateway into disordered eating, but…" — 낙인에 대한 반발도 큼.

## 5. 레딧 — 시장 신호

- **r/vibecoding "How are vibe coded calorie tracker apps still making so much money?"** (⬆116): "they sold it for +$100m 2 months ago… hundreds of clones… many of them manage to surpass $1k-$5k MRR" — 초포화 but 수요 지속, 차별화 없으면 클론 무덤.
- 미수집: "gave up logging food", "need someone to hold me accountable diet" 원쿼리는 노이즈로 미수집 — r/loseit 한정 재검색으로 대체.

## 6. 트위터 (4쿼리 전량 수집)

- **"칼로리 앱"**: 필라이즈 광고 (❤2,148) "AI 고냥이가 내 식단과 건강도 걱정해줌 🥺" — **국내 1위는 '다정한 캐릭터' 톤 → 단호함 포지션은 국내에서 비어 있음.** / "칼로리 직접 계산하기 너무 귀찮아서 작심삼일이 아니라 작심하루" (광고 카피화된 보편 페인).
- **"식단 앱"**: "식단 기록 작심삼일이었던 사람인데…" (❤823) — 반복 포기자 정체성 실재. / "왜 식단 앱 다운받았는지 모르겟음;" — 기록↔행동변화 갭.
- **"식단 기록 포기"**: 직접 발화 드묾 — **포기자는 조용히 사라지는 세그먼트**(잔존 발화 없음). 인접: 11kg 감량 인증+칭찬 요청 (❤2,680) — 피드백 수요 리추얼.
- **"cal ai app"**: "Cal AI has been removed from App Store ➟ used to make $50M ARR ➟ **Sold to MyFitnessPal for $100M**" (❤268) / 성장 담당자 회고 (❤1,580) / "ai slideshow account is doing 15M views alone for a cal ai copycat" (❤460) — 틱톡/릴스 오가닉이 검증된 배포 루프.

## 7. 유튜브 (7쿼리 전량 수집)

- **"cal ai review"**: 최대 조회는 리뷰가 아닌 창업 스토리("How I Built $1.4M/Month AI App At Age 18" 88.3만). 리뷰는 (a) 제휴 긍정 — Greg Doucette 12.5만(설명란 할인코드=스폰서드), (b) **비제휴 정확도 검증/폭로** — Dr. Marc Morris(영양사) 2.7만, "Most Were WRONG" 등. **정확도 회의론이 비제휴 리뷰 기본 논조.**
- **"다이어트 자극/팩폭"**: 키다리형 "못하시는 분들께 한마디" 36.1만, 다노 "포기하고 싶을 때 자극" 31.3만, "작정하고 말하는 쓴소리" 4.2만. 최상위(백만대)는 순수 독설이 아닌 **권위자+방송 클립**(유퀴즈 팩폭 366만, 이지영 -14kg 186만) — 대중화 형태는 "권위자가 웃으면서 때리는 팩폭".
- **"식단 기록/칼로리 사진 앱"**: 인아웃 광고성 459만, 다이어트 카메라 44.4만 — 국내 카테고리 검증. 단 국내는 전부 "기록/추적" 프레임, **"피드백/코치" 프레임 영상은 공백** — 선점 가능.
- **"AI diet coach"**: 승자 문법 = 1인칭 실험담+결과 수치("I Tried AI as a Life Coach for 365 Days" 37.5만, "ChatGPT rapid weight loss 75lb" 33.5만).
- 제목 문법: 2인칭 지적형 / 반전 팩트형 / 수치 증언형. 마케팅 영상은 앱 데모가 아니라 "AI 코치한테 한 달 팩폭 당해봤다 → n kg" 구조가 유리.

## 패턴 요약

1. **기록 포기 이유 Top 3**: ① 누적 피로/숙제화 ② 외식·여행·가족 식사로 리듬 붕괴(→전면 포기, what-the-hell effect) ③ 강박화 자기방어(이 층은 복귀 유도 아닌 안전 설계 대상).
2. **정확도 불만: 확실히 실재** (⬆2,474 실측 포스트). 병목은 부피 추정 — 한식 등 혼합 요리에서 30-40%+. "False precision is more dangerous than admitted uncertainty" → 숫자 경쟁 대신 정성 판정+행동 지시로 우회하는 PRD 설계에 근거.
3. **빡센 코치 수요: 있음(강함)** — "Please bully me"(⬆347·댓글 437), 유료 책임감 지불 의사 발화. 국내 1위 필라이즈는 다정한 톤 → 단호함 포지션 공백.
4. **안전 이슈: 양방향** — ED 이력자에게 위해 가능(스크리닝 필수) + 안전필터 과잉 발동은 정상 사용자 모욕(임계값 설계).
5. **결제 신뢰 훼손**: Cal AI가 위장 결제로 퇴출된 카테고리 — 투명한 과금 자체가 차별화 요소.
