# 맛핀 문서 지도

현재 제품 판단과 운영에 사용하는 문서는 맛핀 문서만 남겼습니다. 시작점은 [맛핀 문서 허브](matpin/README.md)예요.

## 활성 문서

| 문서 | 역할 |
| --- | --- |
| [PRD](PRD.md) | 사용자 문제, 지원 범위와 성공 기준 |
| [TASK](TASK.md) | 현재 구현 상태와 출시 전 남은 일 |
| [PROJECT_STRUCTURE](PROJECT_STRUCTURE.md) | 맛핀 코드, 데이터와 테스트 위치 |
| [ARCHITECTURE](matpin/ARCHITECTURE.md) | 수신, 분석, 저장, 답장과 관리자 인증 구조 |
| [OPERATIONS](matpin/OPERATIONS.md) | 환경 설정, 장애 대응, 배포와 운영 검증 |
| [관리자 CRM 리서치](matpin/research/admin-crm-reference-2026-08-09.md) | 화면 구조를 결정한 관찰 근거 |

설계 계약은 저장소 루트의 `.design-architect/PRODUCT.md`, `.design-architect/EXPERIENCE.md`, `.design-architect/DESIGN.md`에서 관리합니다.

## 정본 규칙

1. 기능 범위가 바뀌면 `PRD.md`와 `TASK.md`를 함께 갱신합니다.
2. 데이터, 보안 또는 API 계약이 바뀌면 `matpin/ARCHITECTURE.md`를 수정해요.
3. 배포 환경과 운영 절차가 바뀌면 `matpin/OPERATIONS.md`에 확인 날짜와 근거를 남깁니다.
4. 날짜가 있는 리서치와 출시 기록은 당시의 증거입니다. 현재 상태를 대신하지 않아요.

## 보존 정책

기존 문서 폴더에는 과거 제품과 실험 근거가 남아 있습니다. 사용자 작업과 연결된 자료를 잃지 않도록 삭제하지 않았고 [문서 아카이브](archive/README.md)로 분류했어요. 현재 맛핀 범위를 판단할 때는 이 문서 지도에 있는 정본만 사용합니다.
