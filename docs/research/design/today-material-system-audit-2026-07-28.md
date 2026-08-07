# Today 통합 화면 — Material Design 3 이탈 감사

## 결론

Today의 정보 순서는 유지하되, M3의 적응형 구간·터치 영역·상태 레이어·포커스·오류 표면을 공통 계약으로 보정했다. 브랜드 시각은 그대로 두고 행동과 접근성 규칙만 Material에 맞췄다.

## 발견과 수정

| 항목 | 기존 이탈 | 수정 |
|---|---|---|
| 적응형 구간 | 800px에서 바로 2열로 바뀌어 M3 medium 구간과 어긋남 | compact `<600`, medium `600–839`, expanded `≥840`으로 분리 |
| Medium 화면 | 태블릿 세로 폭에서도 콘텐츠가 화면 전체로 벌어짐 | 입력·결과 작업 공간을 42rem 안에 모아 읽기 길이 제한 |
| 터치 영역 | 헤더·보조 행동 일부가 44px | 주요·보조 행동의 최소 높이를 48px로 통일 |
| 선택 상태 | 라디오 카드의 선택 색은 있으나 키보드 포커스가 숨은 input에만 생김 | label에 3px focus state layer 표시 |
| Hover 상태 | 카드 테두리만 바뀌어 표면 반응이 약함 | M3 방식의 8% primary state layer 추가 |
| 오류 상태 | 지원 문구는 있었지만 입력 테두리 오류색이 없음 | `aria-invalid` 입력에 error 색과 지원 문구 동시 표시 |
| 작은 라벨 | 결과물 3종 카드의 10px대 보조 글자 | 최소 0.72rem과 1.45 행간으로 상향 |
| Fake-door CTA | 포커스·hover 상태가 없음 | 명시적 hover와 3px focus ring 추가 |
| Motion | 일부 hover가 위치를 2px 이동 | reduced-motion에서 이동 제거 유지 |

## 유지한 결정

- 질문은 한 번에 하나만 활성화한다.
- 가입보다 근거가 있는 아이디어 결과를 먼저 보여준다.
- 제작 신청 뒤 정확한 준비 시각과 3단계 상태를 보여준다.
- 본문 한국어 행간은 1.6 이상을 유지한다.

## 근거

- [Material Design 3 text fields](https://m3.material.io/components/text-fields/guidelines)
- [Material Design 3 layout overview](https://m3.material.io/foundations/layout/layout-overview/overview)
- [Material Design 3 canonical layouts](https://m3.material.io/foundations/layout/canonical-examples/overview)
