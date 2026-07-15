# 외워야 열림 — 앱 열기와 플래시카드 결합 리서치

> Trust Level: L1 Draft. 국내 타겟의 결제 의향은 사용자 검증이 필요하다.

## 결론

`외워야 열림`은 해외 Study Guard의 핵심 흐름을 거의 그대로 한국 시험·자격증 맥락에 적용하는 후보로 유지한다.

- 타겟의 기존 반복 행동: 공부를 미루면서 SNS·쇼츠 앱을 무의식적으로 다시 연다.
- 즉시 결과: 앱을 열려던 매 순간 플래시카드 한 문제를 복습한다.
- 시스템 집행: 정답 전에는 선택한 앱을 차단하고, 정답 후 5분만 해제한다.
- 가장 작은 설치형 MVP: 차단 앱 1개, 내장 문제 10개, 정답 시 5분 해제, 오늘 복습 수.
- 제외 범위: PDF·AI 문제 생성, 여러 덱, 친구 경쟁, 결제, 고급 통계.

## 수요·결제 근거

- Study Guard: 미국 App Store 334개 평가·4.6점. 정답을 맞혀야 SNS를 열 수 있는 동일 메커니즘. 주 $4.99 또는 평생 $79.99 인앱 결제.
- TrustMRR Study Guard 매물: 최근 30일 매출 $1.7K, 성장 38%, 희망가 $150K.
- Opal: 공식 가격 페이지 기준 평가 15만 개 이상, 무료 앱 차단과 연 $99.99 Pro 플랜.
- one sec: 공식 사이트 기준 평균 앱 열기 57% 감소. 앱을 열기 전 마찰을 넣는 행동 변화 수요를 별도로 증명.

## 구조적 차별화

- 기존 차단 앱: 열지 못하게 하거나 잠시 멈추게 한다.
- 기존 플래시카드: 사용자가 공부 앱을 자발적으로 열 때까지 기다린다.
- 외워야 열림: 이미 반복되는 SNS 열기 충동을 플래시카드 복습 트리거로 바꾼다.
- Claude 대체 불가 이유: 답을 설명할 수는 있지만 다른 앱 접근을 OS 수준에서 차단·해제하지 못한다.

## 구현 가능성

Apple Screen Time API의 Family Controls·Managed Settings·Device Activity를 사용한다. Apple 개발 문서상 개발 중 Family Controls entitlement를 사용할 수 있으며, TestFlight·App Store 배포에는 별도 distribution entitlement 요청이 필요하다.

첫 테스트는 개인 기기에 설치하는 개발 빌드로 제한한다. 실제 스토어 출시 심사는 MVP 검증 이후의 별도 위험으로 둔다.

## 출처

- https://apps.apple.com/us/app/study-guard-study-focus/id6744607430
- https://trustmrr.com/startup/study-guard
- https://www.opal.so/pricing
- https://one-sec.app/
- https://developer.apple.com/documentation/xcode/configuring-family-controls
- https://developer.apple.com/documentation/screentimeapidocumentation

## 수집 방법

- 웹·공식 페이지: Firecrawl CLI
- 해외 매출: 로컬 TrustMRR Acquire 데이터셋
- 원시 결과: `.firecrawl/study-to-unlock/`

