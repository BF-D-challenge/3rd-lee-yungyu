# Today flow-image 레퍼런스 요약

결론: 다크 카드와 그라데이션으로 다섯 화면을 같은 모양으로 채우지 않고, `한 번에 결정 하나 → 실제 근거 결과 → 결과 뒤 이메일 요청 → 차분한 처리 상태`만 남긴다.

## 조사 브리프

- 사용자 과업: 만들 아이디어를 정하고, 실제 매출 원본과 연결된 초안을 확인한 뒤 24시간 테스트 제작을 신청한다.
- 진입 트리거: 실험 허브 또는 광고에서 `/today` 진입.
- 현재 기준선: 긴 랜딩과 두 경로, 근거 결과, 이메일 신청, 24시간 제작 상태가 한 제품에 이어진다. 이전 flow-image는 네온 다크 카드와 동일한 CTA를 반복했다.
- 가치 순간: 가입 전에 `누가·언제·무엇을 받는지`와 사용한 매출 원본을 확인한다.
- 검토할 요청: 가입 없음. 결과 전달 이메일은 가치 확인 뒤 제작 신청에서만 요청.
- 결정: 초기 방문부터 제작 접수까지 한 decision strip으로 다시 설계하고, 24시간 뒤 결과 재방문은 별도 흐름으로 분리한다.
- 목표 지표: 근거 결과 확인 후 제작 신청 완료율.
- guardrail: 질문 중 이탈, 근거 펼침률, 이메일 불만, 신청 취소, 24시간 뒤 결과 재방문율.
- 가정: 2026-07-28에 저장한 Mobbin 화면과 canonical URL이 현재 화면 구조 결정을 설명하기에 충분해 재검색하지 않았다.

## Lovable

![Lovable의 입력에서 실제 결과까지](assets/today-unified-2026-07-28/lovable-ai-build-flow.jpg)

- 흐름: `빈 작업 공간 → 한 문장 입력 → 실제 결과 미리보기 → 같은 공간에서 수정`.
- 관찰 E0: 첫 입력은 한 덩어리이고, VALUE에서는 설명보다 실제 생성 결과가 화면의 대부분을 차지한다.
- 전이 판단: `adapt` — Today 결과 화면도 장식 카드 대신 아이디어 결과와 근거 receipt를 가장 크게 둔다.
- 위험·한계: 즉시 완성물을 만드는 서비스가 아니므로 생성 속도와 자동 완성을 약속하지 않는다.
- 출처: [Mobbin flow](https://mobbin.com/flows/f65cb860-b564-4984-8dd7-b62d6e1365e6)

## Squarespace Blueprint AI

![Squarespace Blueprint AI의 점진적 선택](assets/today-unified-2026-07-28/squarespace-guided-build-flow.jpg)

- 흐름: `한 결정 → 이전 선택이 남은 미리보기 → 추천 페이지 선택`.
- 관찰 E0: 작업 결과는 왼쪽에 유지되고, 오른쪽 패널은 현재 결정 하나만 요구한다.
- 전이 판단: `adapt` — 모바일에서는 이전 답을 한 줄 요약으로 접고 현재 질문 하나만 크게 보여준다.
- 위험·한계: 데스크톱 분할 화면을 좁은 모바일에 그대로 축소하지 않는다.
- 출처: [Mobbin flow](https://mobbin.com/flows/6a0880c9-76a2-4390-9a6a-5cce826e77f4)

## Stripe와 Zapier

![Stripe와 Zapier의 처리 상태](assets/today-unified-2026-07-28/processing-status-screens.jpg)

- 흐름: `제출 완료 → 현재 처리 상태 → 예상 시간·알림 방식 → 진행 보기`.
- 관찰 E0: 화려한 성공 장면 없이 한 문장, 짧은 단계선, 다음 행동만으로 대기 불확실성을 줄인다.
- 전이 판단: `adopt` — 마지막 화면은 결과물을 억지로 압축하지 않고 `저장 → 제작 → 이메일` 상태만 보여준다.
- 위험·한계: 준비 시각과 이메일 발송은 서버 상태와 일치할 때만 표시한다.
- 출처: [Stripe screen](https://mobbin.com/screens/7122f301-ec22-41ed-b114-8ed865ce3275), [Zapier screen](https://mobbin.com/screens/06183f18-903c-4557-b5dd-0e9acd6bf7a3)

## Rocket Money — counterexample

![Rocket Money의 가치 전 계정 요청](assets/today-unified-2026-07-28/rocket-money-onboarding-flow.jpg)

- 흐름: `가치 약속 → 계정 생성 → 목표 선택 → 이름 입력`.
- 관찰 E0: 사용자가 개인화 결과를 보기 전에 계정과 이름을 먼저 제공한다.
- 전이 판단: `reject` — Today는 아이디어와 근거를 먼저 보여주고, 이메일은 제작 신청 직전에만 받는다.
- 위험·한계: 금융 연결처럼 계정이 가치의 전제인 제품과 Today의 위험 수준은 다르다.
- 출처: [Mobbin flow](https://mobbin.com/flows/fed2772b-6edd-432f-b195-0691f2d84d04)

## 반복 패턴과 예외

- 반복 E1: Lovable과 Squarespace는 설정 문구보다 사용자가 만든 입력 또는 결과를 넓은 작업 표면에 유지한다.
- 반복 E1: Squarespace와 Stripe/Zapier는 현재 단계에서 필요한 결정·상태만 보여주고 다음 상태를 한 행동으로 연결한다.
- counterexample: Rocket Money의 가치 전 계정 요청은 Today의 익명 결과 우선 계약과 충돌한다.
- 외부 근거 E2: 없음. Mobbin 화면은 출시된 구조만 보여준다.

## 우리 앱에 적용

1. 결정: 밝은 중립 배경, 단색 cobalt CTA, 한 화면 한 과업으로 바꾸고 glow·3D phone·중첩 카드·그라데이션을 제외한다.
2. 결정: 5화면은 `TRIGGER → EFFORT → VALUE → ASK → AFTER`만 담고 24시간 뒤 결과함은 별도 흐름으로 둔다.
3. 근거: E0/E1에서 입력·결과 표면과 현재 결정이 장식보다 우선했다. Rocket Money식 가치 전 가입은 reject한다.
4. 검증: 근거 결과 확인 후 제작 신청 완료율을 primary로, 질문 이탈·신청 취소·이메일 불만을 guardrail로 본다.

> Mobbin 화면은 출시된 구조의 근거이며 성과·규정 준수의 증거가 아니다.

## 제작 결과

- 최종 이미지: [`artifacts/flow-image/today-ui-flow-mobbin-v2.png`](../../../artifacts/flow-image/today-ui-flow-mobbin-v2.png)
- 화면 명세: [`artifacts/flow-image/today-five-screen-mobbin-spec.json`](../../../artifacts/flow-image/today-five-screen-mobbin-spec.json)
- 생성 프롬프트: [`artifacts/flow-image/today-ui-flow-mobbin-prompt.md`](../../../artifacts/flow-image/today-ui-flow-mobbin-prompt.md)
- QA: 1672×941 PNG. 전체 OCR 뒤 3·4·5번 화면을 확대해 `예약과 대화 요약`, `원본 보기`, `이 아이디어로 계속`, `이메일` 문구를 직접 확인했다.
- 보존: 기존 `today-ui-flow-v1.png`는 비교용으로 덮어쓰지 않았다.

## 사용자 정정 — 취향 우선 흐름

구체적인 아이디어가 이미 있는 사람보다, 아이디어는 없지만 자신의 취향은 고를 수 있는 사람을 핵심 사용자로 다시 정했다.

- 새 순서: `아이디어 없음 → 관심 대상 → 관심 순간 → 해결 취향 → 자동 추천 1개`
- 적용: 첫 화면의 기존 아이디어 분기와 자유 입력을 제거하고, 현재 `guided` 계약의 `customer`, `moment`, `strength`를 일상적인 취향 질문으로 바꿨다.
- 보존: 앞에서 고른 값은 다음 질문 상단의 접힌 줄에 계속 남는다.
- 가치 순간: 가입이나 이메일 전에 취향과 연결된 아이디어 하나, 선정 이유, 매출 원본 receipt를 확인한다.
- 최종 이미지: [`artifacts/flow-image/today-ui-flow-taste-first-v3.png`](../../../artifacts/flow-image/today-ui-flow-taste-first-v3.png)
- 화면 명세: [`artifacts/flow-image/today-taste-first-five-screen-spec.json`](../../../artifacts/flow-image/today-taste-first-five-screen-spec.json)
- 생성 프롬프트: [`artifacts/flow-image/today-taste-first-flow-prompt.md`](../../../artifacts/flow-image/today-taste-first-flow-prompt.md)
- QA: 1672×941 PNG. 전체 OCR에서 다섯 단계, 세 질문, 추천 결과와 근거 문구를 확인했다.

## 사용자 정정 — 수익 원본과 현재 순위

첫 문구를 `내 아이디어, 지금 몇 등일까요?`로 바꾸되, 출시 전 아이디어 자체의 가짜 순위를 만들지 않는다. 취향과 가장 가까운 실제 서비스의 공개 수익 원본, 그 서비스의 순위와 금액을 보여주는 약속으로 정의했다.

- 원본 예시: [SetSmart — TrustMRR](https://trustmrr.com/startup/setsmart)
- 2026-08-01 확인값: 최근 30일 매출 `$53,024`, MRR `$18,743`, 누적 매출 `$512,284`, TrustMRR 순위 `153위`
- 확인 방식: Stripe API key, 원본 최종 갱신 2026-08-01 04:15
- 순위 기준: TrustMRR의 활성 스타트업 누적 매출 순위. 1위가 가장 높고 매시간 바뀔 수 있다.
- 제품 경계: Gemini는 순위나 매출을 만들지 않는다. 공개 원본을 고른 뒤 그 작동 구조를 사용자 취향에 맞는 아이디어 문장으로 바꾸는 데만 사용한다.
- 최종 이미지: [`artifacts/flow-image/today-ui-flow-revenue-rank-v4.png`](../../../artifacts/flow-image/today-ui-flow-revenue-rank-v4.png)
- 화면 명세: [`artifacts/flow-image/today-revenue-rank-five-screen-spec.json`](../../../artifacts/flow-image/today-revenue-rank-five-screen-spec.json)
- 생성 프롬프트: [`artifacts/flow-image/today-revenue-rank-flow-prompt.md`](../../../artifacts/flow-image/today-revenue-rank-flow-prompt.md)
- QA: 1672×941 PNG. 전체 OCR와 3·5번 화면 확대 검사로 제목, 금액, 순위, MRR, 갱신일을 확인했다.
