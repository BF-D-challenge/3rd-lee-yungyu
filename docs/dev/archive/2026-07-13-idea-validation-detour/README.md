# Experiment Pass 4개 — 실제 검증 실행 허브 (ARCHIVED)

> **보관된 잘못된 분기:** 후보 하나를 별도 제품으로 선택한다고 해석해 만든 초안이다. 현재 실행 대상이 아니며 외부 모집·결제 실험을 진행하지 않는다. 자세한 사유는 [`ARCHIVED.md`](./ARCHIVED.md)를 따른다.

업데이트: 2026-07-13  
목적: 합성 평가를 통과한 네 아이디어를 같은 방식으로 비교하고, 실제 결제 신호가 가장 강한 하나만 MVP로 선택한다.

## 실행 원칙

1. 네 제품을 동시에 개발하지 않는다.
2. 랜딩·인터뷰·Wizard-of-Oz·실제 결제 행동까지만 병렬 준비한다.
3. `써볼 것 같다`는 통과 근거가 아니다. 결제 또는 환불 가능한 예약금만 결제 신호로 센다.
4. 실제 고객 자료는 최소 수집하고 실험 종료 즉시 삭제한다.
5. 한 후보가 통과해도 나머지를 자동 탈락시키지 않는다. 같은 기간·유입 규모의 수치를 비교한 뒤 하나를 선택한다.

## 후보

| 우선 | ID | 후보 | 구분 | 모집 목표 | 결제 통과 기준 |
|---:|---|---|---|---:|---:|
| 1 | B09-01 | 첫결과 구조대 | 1인 B2B | 강사 5명 | 2명 선결제 |
| 2 | LC11 | 펫시터 인계팩 | 1인 B2B | 독립 펫시터 5명 | 2명 월 결제 |
| 3 | B05-01 | 경력성과증거팩 | B2C | 이직자 10명 | 3명 기간 패스 결제 |
| 4 | C11 | 부모님공문 | B2C | 다자녀 10가구 | 2가구 결제 + 3가구 4주 사용 |

## 공통 문서

- [실험 프로토콜](./common/experiment-protocol.md)
- [인터뷰 기록 양식](./common/interview-record-template.md)
- [개인정보·동의 규칙](./common/privacy-consent.md)
- [후보 비교표](./common/final-comparison-scorecard.md)
- [실제 링크 개통 체크리스트](./common/live-link-checklist.md)

## 후보별 키트

- [B2B 공통 운영 원칙](./b2b/README.md)
- [첫결과 구조대 랜딩](./b2b/first-result-rescue/landing.md) · [로컬 HTML](./b2b/first-result-rescue/landing.html)
- [펫시터 인계팩 랜딩](./b2b/petsitter-handoff/landing.md) · [로컬 HTML](./b2b/petsitter-handoff/landing.html)
- [경력성과증거팩 랜딩](./b2c/B05-01-career-evidence/01-landing-copy.md) · [로컬 HTML](./b2c/B05-01-career-evidence/landing.html)
- [부모님공문 랜딩](./b2c/C11-parent-notice/01-landing-copy.md) · [로컬 HTML](./b2c/C11-parent-notice/landing.html)

## 현재 허용된 상태

- 랜딩 문구·모집 메시지·인터뷰·수기 운영 템플릿 작성: 허용
- 로컬 정적 데모 제작: 허용
- 외부 커뮤니티 게시·DM 발송: 사용자 승인 전 금지
- 실제 결제·예약금 링크 개통: 결제 계정과 환불 정책을 사용자가 확정한 뒤 진행
- 앱 그룹·54조합 추가: 선결제 기준 통과 전 금지
