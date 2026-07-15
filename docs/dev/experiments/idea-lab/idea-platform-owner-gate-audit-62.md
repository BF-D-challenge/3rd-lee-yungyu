# 플랫폼 주인 우위 사전 게이트 — 62개 재검사

검사일: 2026-07-12  
입력: [`archive/queues/idea-user-validation-queue-62.jsonl`](./archive/queues/idea-user-validation-queue-62.jsonl)  
당시 출력: [아이디어 사용자 검증 큐 — 56개](./archive/queues/idea-user-validation-queue-56.md)  
후속 정본: [현재 사용자 검증 큐](./idea-user-validation-queue-current.md)

## 결론

- 기존 일반 검증 큐: **62개**
- 플랫폼 주인 우위 Fail: **5개**
- 시장 폭 Merge: **1개**
- 사용자 검토 가능: **56개 — B2C 30 / 1인 사업자 B2B 26**

이제 `경쟁 제품이 있다`와 `플랫폼 주인이 같은 결과를 기본 제공한다`를 분리한다. 후자는 원본 상태와 실행 권한까지 플랫폼이 소유하므로, 제3자 MVP가 체크리스트·스크린샷 재확인만 더한다면 사용자에게 보여주지 않는다.

## 사용자 검토 전 제거

| ID | 이전 후보 | 판정 | 제거 이유 |
|---|---|---|---|
| D08-01 | 새 휴대폰 이전 누락표 | **Fail** | Apple Quick Start와 Android 기기 이전이 앱·사진·연락처·메시지·설정 등을 공식 설정 흐름에서 직접 옮긴다. 제3자 앱은 전체 이전 상태를 읽을 권한이 없어 표본 체크만 더한다. |
| D08-02 | 백업 복원 시험 | **Fail** | OS·클라우드가 백업 범위와 실제 복원 실행권을 가진다. 제3자 앱에서 파일 한 개를 여는 것은 시스템 백업 전체의 복원 가능성을 증명하지 못한다. |
| D08-03 | 사진 백업 누락판 | **Fail** | Google Photos는 전체·항목별 백업 상태를 직접 보여준다. 같은 결과를 내려면 제3자 앱이 사진·계정 권한을 다시 받아야 하고, 원본 백업 상태에는 더 약하게 접근한다. |
| D08-07 | 수리 맡기기 개인정보 잠금 | **Fail** | Galaxy Maintenance Mode처럼 제조사 기능이 수리 중 개인 데이터 접근을 실제로 차단한다. 제3자 앱은 격리를 실행하지 못하고 체크리스트만 제공한다. |
| D08-22 | 휴대폰 삭제봉투 | **Fail** | 공장 초기화는 OS가 직접 모든 데이터를 지운다. 제3자 앱은 초기화와 함께 사라지므로 초기화 뒤 내부 상태를 더 정확히 검증할 수 없다. |
| A08-05 | 보증금 반환 약속판 | **Merge** | `계약 종료 + 보증금 미반환 + 분할 반환 합의`가 겹치는 시장이 너무 좁다. 별도 앱으로 다시 묻지 않고 `이사반납` 또는 금전 약속 대조 카드 재료로 흡수한다. |

## 자동 Fail 경계

다음 네 질문이 모두 Yes일 때만 플랫폼 주인 우위 Fail이다.

1. 같은 핵심 결과가 OS·기기·공식 플랫폼 흐름 안에 있는가?
2. 새 앱 설치나 데이터 재입력 없이 무료로 얻는가?
3. 플랫폼만 가진 원본 상태 또는 실행 권한이 중요한가?
4. 제3자 MVP의 차이가 체크리스트·수동 확인 재포장뿐인가?

하나라도 No라면 일반 경쟁으로 돌려 제품성·UVP를 평가한다.

## 제거하지 않은 경계 사례

| ID | 후보 | 유지 이유 |
|---|---|---|
| D08-10 | 2단계 번호 교체표 | 여러 계정을 한 플랫폼이 전부 볼 수 없다. 사용자가 선택한 계정의 변경 순서를 만드는 횡단 결과다. |
| B08-01 | 촬영 원본 백업확인 | 카메라 카드와 서로 다른 저장소를 맞추는 전문 작업이다. 한 OS의 백업 완료 표시와 결과가 다르다. |
| A09-03 | PG 수수료 명세표 | 주문·PG 정산·은행 입금이라는 서로 다른 주체의 데이터를 대조한다. 플랫폼 화면의 단순 재표시가 아니다. |
| B06-17 | 깃허브기여팩 | 공개·내보내기 가능한 PR 기록에서 채용용 증거를 새로 만든다. GitHub 기본 화면과 즉시 결과가 다르다. |

## 공식 근거

- Apple Quick Start: https://support.apple.com/en-euro/102659
- Android 기기 간 앱·데이터 복사: https://support.google.com/android/answer/13761358?hl=en
- Android 백업·복원: https://support.google.com/android/answer/2819582?hl=en-en
- Google Photos 백업 상태 확인: https://support.google.com/photos/answer/6193313?co=GENIE.Platform%3DAndroid&hl=en
- Samsung Maintenance Mode: https://www.samsung.com/ca/support/mobile-devices/use-maintenance-mode-on-your-galaxy-phone-or-tablet/
- Android 공장 초기화: https://support.google.com/android/answer/6088915?hl=en

## 운영 규칙

- 이 6개는 이후 10개 묶음과 상세 UVP 카드에 다시 넣지 않는다.
- 플랫폼 기능이 바뀌더라도 `제3자가 독립 결과를 만들 수 있는가`를 다시 증명하기 전에는 복구하지 않는다.
- 플랫폼 주인 우위 Fail은 `Custom Reserve`에도 넣지 않는다. 도메인 지식이 생겨도 권한 열세가 사라지지 않기 때문이다.
- 62개·56개 중간 큐는 `archive/queues/`의 **ARCHIVED / DEPRECATED** 계보 자료다. 현재 판정 정본은 `docs/research/idea-final-decisions-62.jsonl`, 현재 대기열 정본은 `idea-user-validation-queue-current.md/jsonl`이다.
