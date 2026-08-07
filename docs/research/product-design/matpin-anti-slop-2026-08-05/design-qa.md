# 맛핀 모바일 흐름 Anti-slop 개선

## 모드

- polish → audit

## 제품과 여정

- 사용자: Instagram에서 맛집 릴스를 보다가 나중에 다시 찾고 싶은 사람
- 입력: matpin.kr 계정으로 공유한 릴스
- 결과: 릴스 단서를 확인한 뒤 가까운 역별 개인 보관함에 정리된 영상
- 가치 순간: 저장한 영상을 역 이름으로 다시 찾는 순간
- 현재 화면의 주 행동: `Instagram에서 열기`
- 증거 수준: 실제 저장 완료의 증거가 아니라 제품 동작을 설명하는 로컬 UI 시안

## Design Read

- 인지 순서: 1) 릴스를 보내면 역별로 모임 2) 역삼역 결과 예시 3) Instagram에서 열기 4) 필요할 때 저장 방식 확인
- DESIGN_VARIANCE: 3 / 10
- MOTION_INTENSITY: 3 / 10
- VISUAL_DENSITY: 3 / 10

## 제거한 AI slop

- 보라색 광원과 원근 격자
- 영문 대문자 키커와 장황한 외부 제목
- 기울임·밑줄 혼합 제목
- 유리형 도크와 반복되는 필 모양 버튼
- 카드 안에 반복된 2×2 미니 카드
- 반복 스크롤 안내와 중복 Instagram CTA
- 읽을 수 없는 12px 미만 마이크로카피
- 장식용 기울기·회전·블러

## 남긴 요소와 이유

- 어두운 실제 사용 장면: 릴스를 보던 상황을 한 번에 설명한다.
- 역삼역 결과 예시: 입력 이후의 제품 효용을 증명하는 유일한 중심 오브젝트다.
- 흩어진 릴스의 이동: `흩어짐 → 확인 → 역별 정리`의 인과를 설명하는 핵심 모션이다.
- 빨간 점과 활성 아이콘: 브랜드와 현재 상태에만 제한해 사용한다.

## 렌더 검증

- 모바일 전체 흐름: `mobile-scene-0.png` ~ `mobile-scene-5.png`
- 여섯 장면 접촉 시트: `06-mobile-scenes-contact-sheet.png`
- 390 × 844에서 제목, 설명, CTA, 하단 탐색이 잘리지 않는다.
- 여섯 장면을 버튼으로 순회하고 마지막 Instagram CTA 노출을 확인했다.
- 콘솔 error 0개.

## 정적 검증

- `project_context.py check`: passed
- `audit_ui.py` TSX: passed
- `audit_ui.py` CSS: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `git diff --check`: passed

## 남은 가정

- 이 화면은 실제 Instagram 저장 성공을 증명하지 않는 모션 시안이다.
- 실제 저장·실패·중복 처리 상태는 기존 맛핀 데이터 계약을 사용하며 이 화면에서 쓰기를 수행하지 않는다.

final result: passed
