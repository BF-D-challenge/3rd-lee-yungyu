# 맛핀 스토리보드 라운드 랭킹 Design QA

## 비교 대상

- source workflow: 첨부 영상 대본 `08:26~09:40`의 별점·의견·순위 조정·다음 라운드 반복
- implementation: `http://127.0.0.1:3107/matpin/storyboard-ranking`
- browser-rendered implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-storyboard-ranking-2026-08-05/round-01-desktop.png`

## Findings

- 여섯 후보는 모두 `발견 → 보내기 → 장소 확인 → 역별 정리`의 같은 제품 사실을 4프레임으로 보여주며, 휴대폰 포털·궤도·스택·단서 신호·역별 레일·전후 분할의 장면 구성만 다르다.
- 각 후보에 별점 1~5, 의견 240자, 수동 순위 올리기·내리기, 다음 라운드 통과 토글을 제공한다.
- 후보 2개 이상은 다음 라운드로 좁혀지고, 1개는 최종 1위가 된다. 이전 라운드의 순서·별점·의견·통과 후보는 기록으로 보존되며 다시 편집할 수 있다.
- 자동 시안 생성과 서버 동기화는 연결하지 않았고, 평가가 현재 브라우저에만 저장된다고 화면에 명시했다.
- 확대 dialog, Escape 닫기, focus-visible, 44px 행동 타깃, reduced-motion 정적 상태를 제공한다.

## Primary interactions tested

- 5점 입력과 의견 작성
- 2개 후보 통과 선택 → 2라운드 시작
- 새로고침 뒤 2라운드와 1라운드 기록 복원
- `이 라운드 다시 편집` 뒤 기존 의견 복원
- 순위 내리기 뒤 1·2위 실제 교체
- 보드 확대와 닫기
- 브라우저 console error 0개, warning 0개
- TypeScript, 변경 TSX ESLint, Design Architect UI audit 통과

final result: passed

---

# 맛핀 Caring식 데스크탑 2단 랜딩 Design QA

## 비교 대상

- reference: `https://caring.co.kr/`, 인앱 브라우저 1300 × 1040 캡처
- implementation: `http://127.0.0.1:3107/matpin`, 인앱 브라우저 1300 × 1040 캡처
- mobile verification: 390 × 844 반응형 캡처

## Findings

- Caring의 데스크탑 첫 화면은 왼쪽에 브랜드 약속과 핵심 설명을 두고, 오른쪽에 실제 모바일 제품 화면을 배치합니다.
- 맛핀도 같은 인지 순서를 적용했습니다. 왼쪽에는 제품 약속, 실제 저장 흐름 3단계, Instagram CTA를 두고 오른쪽에는 기존 8장면 휴대폰 시연을 유지했어요.
- 데스크탑에서는 랜딩 자체가 8개 화면 높이의 스크롤 컨테이너가 됩니다. 휴대폰 위와 왼쪽 설명 영역 어디에서 휠을 움직여도 같은 컨테이너가 이동합니다.
- 휴대폰은 화면에 고정되고 장면만 바뀌기 때문에 사용자가 제품과 설명의 관계를 놓치지 않습니다.
- 959px 이하에서는 데스크탑 설명을 숨기고 기존 모바일 휴대폰 중심 레이아웃과 내부 스크롤을 유지했습니다.

## Layout verification

- 데스크탑: 왼쪽 설명 390px 이하, 오른쪽 휴대폰 422px 기준, 사이 간격 48px에서 112px
- 외부 스크롤 검증: 왼쪽 설명 위 CUA 스크롤로 메인 컨테이너의 `scrollTop`이 0px에서 760px로 이동
- 전체 스크롤 높이: 8,320px, 1,040px 높이 장면 8개
- 모바일: 데스크탑 설명 `display: none`, 문서 가로 overflow 0px
- CTA: 실제 `https://www.instagram.com/matpin.kr/` 링크 유지

## Verification

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run test:unit`: 45개 파일, 297개 테스트 passed
- `npm run build`: passed
- `git diff --check`: passed
- 인앱 브라우저 데스크탑과 모바일 캡처: 완료

final result: passed

---

# 맛핀 첫 장면 하단 CTA Design QA

## 비교 대상

- reference: 사용자가 1300 × 1040 브라우저 화면에서 지정한 휴대폰 하단 위치
- implementation: `http://127.0.0.1:3107/matpin` 첫 장면

## Findings

- 휴대폰 내부 CTA만 제목 아래에서 화면 하단으로 이동했습니다.
- CTA는 홈 인디케이터 위 94px 영역에 배치해 제품 UI와 겹치지 않습니다.
- 데스크탑 왼쪽 CTA, 다른 장면의 다음 버튼과 마지막 장면 CTA는 변경하지 않았어요.

## Verification

- 첫 장면 CTA: `bottom: 94px`, 높이 42px
- 홈 인디케이터: `bottom: 7px`, 높이 4px
- CTA와 홈 인디케이터 사이 여백: 83px
- 인앱 브라우저 구현 캡처: 브라우저 URL 정책으로 차단됨

final result: blocked

---

# 맛핀 Poly식 사진 수미상관 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/design-qa/matpin-bookend-source-hero.png`
- implementation screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/design-qa/matpin-bookend-final.png`
- combined comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/design-qa/matpin-bookend-comparison.png`
- implementation: `http://127.0.0.1:3107/matpin`, scene 01과 scene 08
- browser screenshot pixels: source와 implementation 모두 `1300 × 1040`
- device screen CSS size: source와 implementation 모두 `390 × 844`, 동일 브라우저와 동일 밀도
- state: 다크 모드, 첫 제품 약속과 마지막 DM 저장 결과

## Findings

- P0, P1, P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 첫 장면과 마지막 장면 모두 같은 좌측 브랜드, 중앙 2행 제목, 짧은 설명의 위계를 유지합니다. 마지막 제목은 DM 결과를 직접 말해 시작 장면과 역할이 겹치지 않아요.
- 간격과 레이아웃: 같은 휴대폰 프레임과 같은 사진 크롭을 사용합니다. 제목 영역은 두 장면 모두 `332 × 150`, CTA는 `174 × 42`, 중앙 제품 UI는 `132 × 284`로 일치해요.
- 색과 시각 토큰: 마지막 장면도 첫 장면과 같은 사진 밝기와 오버레이를 사용합니다. 중앙 휴대폰의 내용만 역별 보관함에서 Instagram DM 3개와 계정 보관함 요약으로 바뀝니다.
- 이미지 품질: 두 장면 모두 `/images/matpin/matpin-poly-workspace-viewer-v2.png`를 같은 전체 화면 슬롯에서 사용합니다. 별도 CSS 그림이나 대체 이미지 없이 실제 이미지 자산을 재사용했습니다.
- 카피와 콘텐츠: 시작은 `맛집 릴스를 역별로 모아드려요`, 끝은 `저장될 때마다 DM이 도착해요`로 연결됩니다. 약속과 결과가 한 쌍으로 읽히며 DM 3개, 역 3개, 릴스 12개가 제품 증거로 남아요.

## Full-view comparison evidence

- `matpin-bookend-comparison.png`에서 첫 장면과 마지막 장면을 같은 캔버스에 배치해 기기 크기, 사진 크롭, 제목 위치, 결과 카드 밀도를 비교했습니다.
- 동일한 작업 공간 사진이 처음에는 제품 약속의 무대, 마지막에는 저장 완료의 배경으로 재등장합니다. Poly의 시작과 끝이 같은 세계로 돌아오는 원리를 유지해요.

## Focused region comparison evidence

- 별도 확대 비교는 필요하지 않았습니다. 동일한 390 × 844 기기 화면과 같은 이미지 자산을 사용하며, 전체 비교 화면에서 제목, CTA, DM 카드 및 배경 사진의 식별 여부를 충분히 확인했습니다.

## Comparison history

1. 이전 구현
   - [P1] 마지막 장면의 사진 불투명도가 낮아 첫 장면과 같은 공간으로 돌아왔다는 점이 보이지 않았습니다.
2. 수정
- 마지막 장면의 사진 밝기, 제목 위치, CTA 위치를 첫 장면과 같은 값으로 맞췄습니다.
- 첫 장면의 중앙 보관함 UI와 같은 `132 × 284` 슬롯에 마지막 DM 결과와 계정 보관함 요약을 하나의 휴대폰 화면처럼 넣었어요.
3. 수정 후 비교
- 같은 사진, 같은 휴대폰 프레임, 같은 중앙축 안에서 보관함이 DM 결과로 자연스럽게 바뀝니다.
   - P0, P1, P2 차이는 남지 않았습니다.

## Primary interactions tested

- 세로 스크롤로 scene 01부터 scene 08까지 이동
- 첫 장면 CTA의 실제 Instagram 프로필 링크 확인
- 마지막 장면 DM 3개와 계정 보관함 요약 노출 확인
- 첫 장면과 마지막 장면에서 하단 내비게이션이 숨겨지고 CTA 하나만 남는지 확인
- 브라우저 console error 0개, warning 0개

final result: passed

---

# 맛핀 8단계 역별 자동 정리 장면 Design QA

## Comparison target

- source visual truth: 2026-08-05 브라우저 주석에 첨부된 기존 8단계 화면
- implementation: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`, scene 08
- implementation screenshot: `/tmp/matpin-scene8-clarified.png`
- source pixels: 1300 × 1040 브라우저 캡처, 고정 device screen 390 × 844 CSS px
- implementation pixels: 1280 × 720 브라우저 캡처, 같은 고정 device screen 390 × 844 CSS px를 stage에 축소 표시
- state: dark mode, 08/10 `역별 자동 정리`

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 기존 화면은 `역삼역`과 작은 릴스 한 장만 있어 자동 정리의 원인과 결과를 이해하기 어려웠다.
- 수정 화면은 `장소 확인 완료 → 가장 가까운 역 · 역삼역 → 저장 완료`를 한 카드 안에서 순서대로 보여준다.
- 제목을 은유적인 `장소는 가까운 역을 만나요`에서 `릴스가 가까운 역에 저장돼요`로 바꿔 장면의 역할을 직접 설명한다.

## Fidelity surfaces

- typography: 기존 장면의 산세리프 위계와 2행 제목을 유지하고 결과 카드 안의 보조 문구만 더 작게 배치했다.
- spacing and layout: 비어 있던 중앙 영역을 300px 폭의 단일 결과 카드로 묶고 하단 `다음` 버튼 및 탭 바와 겹치지 않게 했다.
- colors: 기존 다크 토큰과 빨간 강조색을 유지하며 `저장 완료`만 상태색으로 사용했다.
- image quality: 기존 9:16 떡볶이 릴스 원본을 자르거나 늘리지 않고 86px 폭의 세로 카드로 유지했다.
- copy: 장소 판별, 역 매칭, 저장 완료를 각각 한 문장으로 구분했다.

## Comparison history

1. 이전 구현 [P1]
   - 작은 릴스와 `역삼역` 라벨만 보여 장면의 목적이 모호했다.
2. 수정
   - 인과 순서, 역별 보관함 이름, 도보 거리, 저장 완료 상태를 추가했다.
   - 이전 장면에서 이미 설명한 캡션·댓글·영상 단서 표시는 이 장면에서 제거했다.
3. 수정 후 비교
   - 8단계만 보아도 `릴스가 장소를 찾고 역삼역 보관함에 들어갔다`는 결과가 읽힌다.
   - 장면 전환 버튼과 하단 내비게이션의 위치 및 동작을 보존했다.

## Primary interactions tested

- `흐름 보기` → `장소 읽기` → `다음`으로 scene 08 진입
- scene 08에서 `다음` 버튼 노출과 하단 탭 상태 확인
- 브라우저 DOM에서 8단계 제목, 매칭 결과, 저장 완료 문구 확인

final result: passed

---

# 맛핀 Poly 모바일 흐름 10장 확장 Design QA

## 비교 대상

- source visual truth: `https://poly.app/` 모바일 흐름의 장면 08, 31, 68
- source screenshots: `/var/folders/s4/gjxlysx94hx4byf5snyfrrm80000gn/T/matpin-poly-mobile-audit-2026-08-05/poly-08.png`, `poly-31.png`, `poly-68.png`
- implementation: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`
- implementation screenshots: `/tmp/matpin-expanded-scatter-screen.png`, `/tmp/matpin-expanded-clues-screen.png`, `/tmp/matpin-expanded-final-postfix-screen.png`
- combined comparison evidence: `/tmp/matpin-poly-expanded-scatter-qa.png`, `/tmp/matpin-poly-expanded-clues-qa.png`, `/tmp/matpin-poly-expanded-final-postfix-qa.png`
- normalized app viewport: `390 × 844`, device scale factor 1

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트·타이포그래피: Poly처럼 한 장면에 굵은 약속 한 줄과 짧은 설명만 유지했다. 한국어 제목은 1.18 행간과 큰 자간 보정을 유지해 390px 화면에서 두 줄 위계가 무너지지 않는다.
- 간격·레이아웃: 기존 5개 스냅을 10개로 확장했지만 한 화면에는 하나의 상태만 보인다. 제목, 시각 증거, 다음 행동, 하단 단계 메뉴가 서로 겹치지 않는다.
- 색상·토큰: 검은 디지털 공간과 흰 글자를 기본으로 두고, 맛핀 빨강은 선택·저장·현재 단계에만 사용했다. 장식용 색 면을 추가하지 않았다.
- 이미지 품질: 여섯 릴스는 서로 다른 AI 썸네일을 사용한다. 하나의 저장 서사에서는 떡볶이 릴스가 Instagram 시청, 전송, 단서 읽기, 역삼역 저장, 최종 보관함까지 동일하게 유지된다.
- 카피·콘텐츠: 초반은 `보던 맛집은 금세 흩어지니까`처럼 감각적으로, 실제 행동 구간은 `공유 버튼`, `matpin.kr`처럼 구체적으로 썼다. 현재 Instagram 프로필 링크의 실제 동작에 맞춰 CTA는 `확인하기`로 표시한다.
- 아이콘: Instagram형 UI, 단서, 역별 보관함은 설치된 아이콘 라이브러리의 동일한 선형 계열을 사용하며 크기와 스트로크가 일관된다.
- 접근성·동작: 10개 스크롤 스냅, `다음`, `결과 보기`, 세 개의 단계 바로가기가 실제 상태를 바꾼다. 포커스 표시와 `prefers-reduced-motion` 전환을 유지한다.

## Comparison history

1. 첫 확장 구현
   - [P1] 공유한 떡볶이 릴스가 결과에서 껍데기 릴스로 바뀌던 인과 오류가 있었다.
   - [P2] 4개 릴스 보관함 하단의 보조 문구가 컨테이너 경계에 걸렸다.
   - [P2] 최종 화면에도 `결과 보기` 버튼이 남아 중복 행동이 되었다.
2. 수정
   - 전송 이후 모든 장면을 동일한 떡볶이 소스 이미지와 텍스트로 연결했다.
   - 보관함 안의 중복 보조 문구를 제거하고 2×2 영상 그리드와 `방금 저장` 표시만 남겼다.
   - 최종 화면에서는 상단 건너뛰기 버튼을 제거하고 Instagram CTA만 남겼다.
3. 최종 비교
   - 흩어진 릴스, 단서 읽기, 마지막 결과를 Poly 대응 장면과 390×844로 나란히 비교했다.
   - OCR로 핵심 제목, 단계 수 `10`, `역삼역`, `릴스 4개`, 최종 CTA가 잘리지 않고 읽히는 것을 확인했다.

## Primary interactions tested

- 첫 화면 `흐름 보기`에서 2단계 진입
- `다음` 버튼으로 2단계부터 10단계까지 순차 이동
- `결과 보기`로 10단계 직접 이동
- `장소 읽기` 바로가기로 7단계 이동
- `역별 보관함` 바로가기로 9단계 이동
- 최종 Instagram CTA의 `https://www.instagram.com/matpin.kr/` 링크 계약
- 390×844 실제 모바일 뷰포트와 1400×1100 1:1 디바이스 화면 확인

## Follow-up polish

- [P3] 실제 모바일 기기에서 빠른 연속 스와이프 시 장면 정착 속도를 한 차례 체감 조정할 수 있다.

final result: passed

---

# Matpin Poly 모바일 플로우 복원 Design QA

## 비교 대상

- source visual truth 1: `/var/folders/s4/gjxlysx94hx4byf5snyfrrm80000gn/T/codex-clipboard-ed9f924a-ec1d-41f6-87e4-21dc5bd06e84.png`
- source visual truth 2: `/var/folders/s4/gjxlysx94hx4byf5snyfrrm80000gn/T/codex-clipboard-1c5e8f88-258c-4fbe-92a9-dc25ffd87a40.png`
- implementation: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`
- implementation files: `src/components/organisms/tastepin/matpin-mobile-frame.tsx`, `src/components/organisms/tastepin/matpin-mobile-frame.module.css`
- hero comparison: `docs/research/product-design/matpin-poly-mobile-2026-08-05/06-qa-hero-side-by-side.png`
- scattered-reels comparison: `docs/research/product-design/matpin-poly-mobile-2026-08-05/07-qa-scattered-side-by-side.png`
- hero viewport: reference와 implementation 모두 `390 × 844` CSS px, density 1
- scattered-reels viewport: reference와 implementation 모두 `1280 × 720` CSS px, density 1

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 첫 장면의 따뜻한 어두운 책상, 인물의 뒷모습, 중앙 제품 폰, 제목·설명·CTA·스크롤 힌트를 원본 구도에 맞췄다.
- 첫 CTA를 누르면 설명용 중간 장면 없이 두 번째 기준 화면인 흩어진 릴스 장면으로 바로 이어진다.
- 두 번째 장면은 바깥의 검은 프레젠테이션 무대, 중앙 기기 크기, 여섯 릴스의 방사형 배치, 상단 진행 표시, 하단 도크를 기준 이미지와 같은 위계로 유지한다.
- 이후에는 `단서 확인 → 역별 정리 → 저장 결과 → 최종 CTA`로 이어지는 6개 고정 장면을 유지한다.
- 일반 스크롤을 막지 않고, 키보드·버튼·스와이프 입력을 지원하며 `prefers-reduced-motion`에서는 과한 이동과 흐림을 줄인다.

## Full-view comparison evidence

- `06-qa-hero-side-by-side.png`에서 390 × 844 첫 화면의 배경 크롭, 문구 위치, CTA 배열, 제품 폰과 스크롤 힌트를 나란히 확인했다.
- `07-qa-scattered-side-by-side.png`에서 1280 × 720 전체 무대, 폰 프레임, 릴스 카드 분산 범위, 도크와 진행 표시를 나란히 확인했다.

## Focused region comparison evidence

- 첫 화면의 `역별 맛집 / 릴스 보관함` 제목과 중앙 제품 폰을 확대해 대비·겹침·하단 여백을 확인했다.
- 두 번째 화면의 6개 릴스 카드와 `보낸 릴스를 한곳에서 모아요` 영역을 확대해 이미지 자막, 기울기, 카드 간 간격을 확인했다.

## Comparison history

1. 이전 시안
   - [P1] 첫 화면이 사용자가 선택한 책상 장면이 아니라 흩어진 릴스 장면에서 시작했다.
   - [P2] 첫 화면과 두 번째 기준 화면 사이에 불필요한 설명 장면이 끼어 있었다.
2. 수정
   - 선택한 첫 장면을 0번 상태로 복원했다.
   - 첫 CTA가 두 번째 기준 화면으로 직접 이동하도록 장면 인덱스와 도크 상태를 다시 매핑했다.
   - 두 번째 장면 설명을 기준 이미지의 `저장한 릴스가 화면 가장자리에서 한눈에 보여요.`로 복원했다.
3. 최종 비교
   - 동일 크기 비교에서 P0/P1/P2 없음.
   - 여섯 장면 버튼 순회, 최종 CTA, 콘솔 오류 0개를 확인했다.

## Primary interactions tested

- `저장 방법 보기` 클릭: 첫 장면 → 흩어진 릴스 장면
- 화면 내 `위로 밀어 계속 보기` 클릭과 다음 장면 진행
- 이전/다음 키보드 이동과 진행 표시
- 여섯 장면 전체 순회 및 최종 `Instagram에서 matpin.kr 열기` CTA 노출
- 브라우저 콘솔 warning/error 0개

## Verification

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run test:unit`: 45 files, 294 tests passed
- `git diff --check` (관련 컴포넌트): passed

final result: passed

---

# 맛핀 모바일 스토리보드 구도 분리 Design QA

## 비교 대상

- implementation: `http://127.0.0.1:3107/matpin/storyboard-ranking`
- Mobbin evidence: `docs/research/mobbin/matpin-storyboard-visual-diversity-2026-08-05.md`
- mobile screenshot: `docs/research/product-design/matpin-storyboard-ranking-2026-08-05/round-01-mobile-390.png`
- QA viewport: 데스크톱 1280×720, 모바일 CSS 390×844·DPR 2

## Findings

- A~F의 카메라 시점을 정면, 탑뷰, 3/4 사선, 매크로, 측면 레일, 대각 분할로 분리했다.
- 네 장면 모두 실제 390×844 비율을 유지하고 상태바, Dynamic Island, 홈 인디케이터가 같은 기기 좌표에 있다.
- 모바일에서는 카드 내부만 가로 스크롤하고 평가·라운드 행동은 세로 문서에 유지된다.
- 실제 Mobbin 출처와 가져온 원리를 후보 헤더에서 확인할 수 있다. Google Maps는 지도 우선 반례로 표시했으며 맛핀 화면에는 지도를 추가하지 않았다.
- TypeScript와 ESLint 오류가 없다.

## Primary interactions tested

- 1280px에서 여섯 후보의 장면 구도 시각 비교
- 390px에서 첫 휴대폰 프레임 크기, 카드 내부 가로 넘김, 하단 라운드 행동 배치
- 후보별 Mobbin 링크, 확대 버튼, 순위·별점·의견·통과 계약 유지

final result: passed

---

# 맛핀 Poly 첫 장면 — 릴스를 보는 여성·AI 썸네일 치환 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/poly-live-start-audit-2026-08-03/01-hero.jpg`
- implementation: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`
- browser-rendered implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/implementation-reference-led-thumbnails.png`
- scattered-reels implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/implementation-reference-led-scattered.png`
- reel-effects implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/implementation-reel-effects-captions.png`
- reel-effects scattered state: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/implementation-reel-effects-scattered.png`
- responsive implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/implementation-390x844.png`
- full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/comparison-reference-led-thumbnails.png`
- focused comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-hero-qa-2026-08-03/comparison-reference-led-focus-product.png`
- state: 첫 hero, `역별 맛집 릴스 보관함`, 제품 UI가 중앙 휴대폰에 보이는 상태
- source pixels: `1280 × 720`; implementation pixels: `390 × 844`; implementation CSS screen: `390 × 844`; deviceScaleFactor `1`
- density normalization: source를 높이 `844px`로 정규화하고 구현과 같은 높이로 나란히 배치했다. 원본은 가로, 맛핀은 사용자가 요청한 모바일 세로 화면이므로 절대 좌표 대신 `상단 브랜드 → 중앙 제목·설명·2개 CTA → 제품 기기 → 하단 탐색 안내`의 상대적 화면 비율을 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: Poly의 굵은 sans 첫 줄과 serif 밑줄 두 번째 줄을 `역별 맛집 / 릴스 보관함`으로 치환했다. 설명과 두 CTA도 같은 중앙 위계와 짧은 길이를 유지하며 390px에서 잘리지 않는다.
- 간격과 레이아웃: Poly의 상단 브랜드·우측 행동·중앙 카피·제품 기기·하단 탐색 안내 순서를 그대로 유지했다. 휴대폰 UI는 사진 속 빈 화면의 `x 124, y 310, w 136, h 300` 슬롯에 맞춰 배치했다.
- 색과 시각 토큰: 원본의 따뜻한 실제 작업 공간과 흑백 CTA 대비를 유지했다. 장면 0에서는 기존 디지털 grid·neon glow·진행률을 숨겨 추가적인 AI 다이어그램 표현이 없다.
- 이미지 품질과 자산 충실도: 실제 촬영 같은 편집 이미지에서 여성은 화면 아래의 뒤쪽 어깨·손으로만 보인다. 휴대폰 안의 돼지껍데기·소고기·매운 등갈비·치즈 닭갈비는 실제 저장 릴스 썸네일의 강한 플래시, 극근접, 집게가 들어오는 구도를 참고해 새로 생성했다. 원본 릴스 캡처 자체는 사용하지 않으며 네 생성 이미지의 OCR 결과는 모두 글자 0개다. 휴대폰 UI는 코드 레이어로 분리돼 읽을 수 있다.
- 릴스 후처리와 자막: 참조 릴스의 직접 플래시, 따뜻한 채도, 강한 대비, 하단 2줄 흰색 자막을 코드 레이어로 재현했다. 음식마다 필터 강도를 다르게 적용하고, 자막은 이미지에 굽지 않아 문구를 따로 수정할 수 있다.
- 카피와 콘텐츠: `Instagram에서 matpin.kr로 보내면 가까운 역별로 정리해요.`와 `역삼역`만 표시한다. 지도, 위치 수집, 자동 DM 같은 범위 밖 기능은 추가하지 않았다.
- 행동과 접근성: `Instagram 열기`, `matpin.kr 열기`는 실제 Instagram 프로필을 연다. `저장 방법 보기`와 `스크롤해서 둘러보기`는 다음 장면으로 이동한다. 실제 390×844 브라우저에서 문서 가로 overflow는 `0px`이고 CTA는 화면 안에 보인다.

## Full-view comparison evidence

- `comparison-reference-led-thumbnails.png`에서 원본 노트북을 중앙 휴대폰으로, 주변 파일과 작업물을 실제 릴스 촬영 문법을 참고한 AI 음식 사진으로 치환했다. 상단 브랜드, 중앙 약속·설명·가로 CTA 두 개, 하단 제품 기기와 스크롤 안내의 읽기 순서가 동일하다.
- 여성은 별도의 정면 광고 모델이 아니라 Poly의 제품 사용 시점을 만드는 전경으로만 들어가며, 중앙 제품 기기를 가리지 않는다.

## Focused region comparison evidence

- `comparison-reference-led-focus-product.png`에서 원본의 여러 파일과 구현의 서로 다른 AI 음식 썸네일 4장을 같은 입력에서 확대 비교했다. 썸네일은 모두 세로 crop에서 음식 중심이 유지된다.
- `implementation-reference-led-scattered.png`에서 이후 장면의 여섯 카드도 참조 기반 AI 음식 사진만 사용하고, 실제 릴스 화면이나 원본 계정 정보가 남지 않았음을 확인했다.
- 390px 구현에서도 브랜드와 우측 행동, 제목, 설명, CTA가 겹치거나 잘리지 않는다.

## Comparison history

1. 이미지 편집 1차
   - [P2] 여성의 검지가 휴대폰 화면 위를 가려 코드 UI를 올리면 손 위에 UI가 나타날 위험이 있었다.
   - fix: 손을 휴대폰 오른쪽 책상 위로 이동하고 검지는 베젤 옆에만 오도록 이미지를 다시 편집했다.
   - post-fix evidence: `matpin-poly-workspace-viewer-v2.png`와 `implementation-viewer-v2.png`에서 화면과 네 면의 베젤이 모두 보인다.
2. 최종 비교
   - full-view와 focused copy 비교에서 P0/P1/P2 없음.
3. AI 릴스 썸네일 치환
   - 실제 테스트 릴스 화면을 제거하고 서로 다른 AI 음식 썸네일 4장으로 첫 화면·흩어진 릴스·역별 저장 결과를 함께 교체했다.
   - post-fix evidence: `implementation-ai-thumbnails.png`, `comparison-ai-thumbnails-focus-product.png`에서 실제 릴스 UI나 원본 캡처 없이 네 음식 사진이 구분된다.
   - P0/P1/P2 없음.
4. 실제 릴스 촬영 문법 반영
   - [P2] 1차 AI 음식 사진은 조명과 구도가 너무 정돈돼 실제 저장 릴스보다 광고 사진처럼 보였다.
   - fix: 실제 `yeoksam-sanjang-reel.jpg`와 역삼역 썸네일 모음을 참조 이미지로 넣고 강한 휴대폰 플래시, 극근접, 집게, 연기와 기름 반사를 반영한 새 이미지 4장으로 교체했다.
   - post-fix evidence: `implementation-reference-led-thumbnails.png`, `implementation-reference-led-scattered.png`.
   - P0/P1/P2 없음.
5. 릴스 후처리와 자막 반영
   - [P2] 참조 기반 AI 사진은 구도는 유사했지만, 실제 릴스에서 보이는 강한 대비와 하단 2줄 훅 자막이 없어 정지 음식 사진처럼 보였다.
   - fix: 카드별 대비·채도·밝기 필터, 비네팅, 플래시 반사 레이어와 음식 장면을 설명하는 2줄 자막을 CSS/HTML로 추가했다. 확인되지 않은 장소명이나 인기 주장은 넣지 않았다.
   - post-fix evidence: `implementation-reel-effects-captions.png`, `implementation-reel-effects-scattered.png`.
   - 반복 카드의 React 키 충돌도 고쳐 브라우저 console error 0개를 확인했다.

## Primary interactions tested

- `저장 방법 보기`: scene `0 → 1` 전환
- `위로 밀어 계속 보기`: scene `1 → 2 → 3`, AI 릴스 흩어짐 상태 확인
- `Instagram 열기`, `matpin.kr 열기`: `https://www.instagram.com/matpin.kr/` 링크 계약
- `390 × 844`: document `scrollWidth 390px`, viewport `390px`, CTA 표시
- 브라우저 console: error 0개, warning 0개
- TypeScript와 변경 TSX ESLint 통과

## Follow-up polish

- [P3] 실제 모바일 기기에서 어두운 화면 밝기와 사진 속 손 피부 톤만 마지막으로 확인할 수 있다.

final result: passed

---

# MATPIN 모션 최종 후보 05·03·01 — 3개 동시 비교 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-3-1/source-05-03-01-share.png` — 기존 05, 03, 01의 `390 × 844` 보내기 상태를 선호 순서대로 결합
- browser-rendered implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-3-1/desktop-share-v3.png`
- mobile implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-3-1/mobile-share-v2.png`, `mobile-analyze-v2.png`, `mobile-saved-v2.png`
- reduced motion: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-3-1/mobile-reduced-motion.png`
- full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-3-1/qa-contact-sheet.png`
- route: `http://127.0.0.1:3107/matpin/motion-lab/compare-5-3-1`
- state: 보내기 4%, 장소 확인 46%, 역별 저장 93%, 한 화면 직접 스크롤 23%, reduced motion 정적 비교
- source pixels: 결합 전 각 `390 × 844`, 결합 후 `1170 × 844`
- implementation pixels / CSS viewport: desktop `1280 × 720`, mobile `390 × 844`, deviceScaleFactor `1`
- density normalization: contact sheet에서 desktop implementation을 source 결합 폭과 같은 `1170px`로 정규화했다. 각 iframe은 원본 `390 × 844` 비율을 그대로 유지한다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 상단 제목은 `05 · 03 · 01` 순서를 한 줄로 유지하고, 각 패널의 번호·기법명·설명을 동일 위계로 표시한다. 모바일에서는 설명만 숨기고 기법명은 말줄임으로 남겨 세 열을 유지한다.
- 간격과 레이아웃: desktop과 `390 × 844` 모두 3열을 유지한다. 모바일 각 패널은 약 `125px`이며 페이지 `scrollWidth`와 `clientWidth`가 모두 `390px`로 가로 overflow가 없다. 공용 조작기는 화면 아래에 고정된 한 구역으로 남는다.
- 색과 토큰: 기존 비교실의 검정 무대, 흰 제목, 회색 보조 문구, 산호색 활성 상태를 그대로 사용한다. 05의 실제 `.riv` 미연결 안내는 낮은 채도의 주황 badge로 분리했다.
- 이미지 품질과 자산 충실도: 세 실제 프로토타입 경로를 iframe으로 표시해 여성 이미지, 산장가든 릴스, 역삼역 카드가 source 그대로 보인다. 이미지를 새로 그리거나 대체하지 않았다.
- 카피와 콘텐츠: `보내기 → 장소 확인 → 역별 저장`과 `역삼역`, `저장한 영상 1개`를 세 화면 모두 동일하게 유지한다. 05가 실제 Rive 엔진 파일이 아닌 구조 프로토타입이라는 범위를 숨기지 않는다.
- 아이콘과 행동: 각 패널의 `단독 보기`, 공용 range, 세 장면 버튼이 실제로 동작한다. 한 iframe을 직접 스크롤했을 때 공용 진행률이 `4% → 23%`로 바뀌고 나머지 화면도 같은 진행률을 따른다.
- 접근성: 상단 돌아가기, 단독 보기, 장면 버튼은 접근성 이름을 가진다. 공용 버튼은 44px 터치 영역과 focus-visible을 유지한다. reduced motion에서는 세 iframe이 정적 문서로 바뀌고 range와 세 버튼이 모두 disabled 된다.
- 모바일 의도적 제약: 한 화면에서 3개 모션 궤적을 비교하는 목적상 iframe 안의 작은 본문은 정독용 크기가 아니다. 세부 확인은 각 패널의 `단독 보기` 링크로 보완한다.

## Full-view comparison evidence

- `qa-contact-sheet.png` 위쪽은 05·03·01의 원본 개별 프레임, 아래쪽은 실제 3열 비교 화면이다. 원본의 주인공 이미지, 릴스 카드, 공유 대상, 하단 세 단계가 세 열 모두에서 보존된다.
- desktop `1280 × 720`에서 세 패널, 상태 안내, 공용 진행률, 세 장면 버튼이 한 화면에 함께 보인다.
- mobile `390 × 844`의 세 상태 캡처에서 세 패널이 줄바꿈 없이 유지되고 46%·93%에서 동일 카피와 결과 카드로 동시에 전환된다.

## Focused region comparison evidence

- source와 implementation을 합친 contact sheet에서 세 iframe의 제목, 여성 이미지, 릴스 crop, 공유 대상 카드, 하단 단계표를 함께 확대 확인했다. 실제 iframe을 축소 표시하는 구조여서 asset crop과 typography가 각 원본과 동일하다.
- 모바일 46%와 93% 캡처를 별도로 확인해 `장소를 확인하고`, `역별 보관함에 차곡차곡`이 세 열에서 같은 상태로 보이는지 검증했다.

## Comparison history

1. 안내 badge 겹침
   - [P2] 첫 desktop/mobile 렌더에서 05의 `.riv` 미연결 안내가 세 패널 header 위에 떠서 기법명이 일부 가려졌다.
   - fix: badge를 fixed overlay에서 별도 grid row로 옮겨 header와 겹치지 않게 했다.
   - post-fix evidence: `desktop-share-v3.png`, `mobile-share-v2.png`에서 안내와 세 header가 모두 분리되어 보인다.
2. 최종 비교
   - P0/P1/P2 없음.

## Primary interactions tested

- 공용 `보내기`, `장소 확인`, `역별 저장`: 세 iframe을 4%, 46%, 93%로 동기화
- 첫 iframe 직접 스크롤: 공용 진행률 23% 반영 및 나머지 iframe 추종
- 세 `단독 보기` 링크와 맛핀 돌아가기 링크의 실제 목적지 존재
- `390 × 844`: 세 패널 폭 각 약 125px, 가로 overflow 없음
- reduced motion: `정적 비교`, range와 세 장면 버튼 disabled, 세 정적 문서 유지
- 브라우저 console: error 0개, warning 0개
- 정적 검사: TypeScript, 변경 파일 ESLint, Design Architect `audit_ui.py`, project context check, `git diff --check` 통과

## Follow-up polish

- [P3] 실제 iPhone Safari와 중급 Android에서 세 iframe 동시 렌더의 fps, 발열, 메모리를 측정해야 한다.
- [P3] 05를 최종 채택하면 같은 상태 계약을 실제 `.riv` 파일로 연결한 뒤 파일 크기와 첫 로드 시간을 다시 비교해야 한다.

final result: passed

---

# 맛핀 Poly 모바일 흐름 치환 목업 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/poly-mobile-audit-2026-08-03/01-mobile-hero.png`, `05-mobile-content-emerge.png`, `09-mobile-search-query.png`, `14-mobile-final-results.png`, `32-mobile-end-stable.png`
- implementation: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`
- implementation screenshots: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-mobile-adaptation-2026-08-03/01-matpin-hero.png`, `05-matpin-scattered.png`, `02-matpin-clues.png`, `03-matpin-result.png`, `04-matpin-final.png`
- full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-poly-mobile-adaptation-2026-08-03/comparison-sheet.jpg`
- CSS viewport: 제품 화면 `390 × 844`, 전체 QA 브라우저 `1400 × 1200`
- pixel dimensions: source와 implementation 모두 장면별 `390 × 844`
- density normalization: `deviceScaleFactor 1`, `[data-testid="device-screen"]` 경계 `390 × 844` 확인 후 동일 크기로 잘라 비교
- state: hero → reels emerge/scatter → caption/comment/video evidence → Yeoksam Station result → final Instagram action

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트·타이포그래피: Poly의 화면 상단 큰 약속과 짧은 보충 문장 위계를 유지하되, 한국어 제목은 37px·1.12 leading과 굵은 weight로 모바일에서 두 줄 안에 읽힌다.
- 간격·레이아웃: 상단 브랜드·진행률, 중앙 고정 무대, 하단 3개 장면 dock을 모든 상태에서 같은 위치에 유지한다. 지속 컨트롤이 릴스, 장소 단서, 최종 CTA를 가리지 않는다.
- 색상·토큰: Poly의 밝은 책상 세계를 복제하지 않고 사용자가 고른 맛핀 다크 디지털 세계를 유지했다. 보라색은 장면 깊이와 최종 CTA, 빨간색은 선택·저장 상태에만 사용한다.
- 이미지 품질: 실제 테스트 릴스 이미지 한 장을 shared object로 재사용해 `핸드폰 → 흩어진 Instagram Reel → 역삼역 보관함` 정체성이 이어진다. 외부 파일·책상 이미지는 사용하지 않았다.
- 카피·콘텐츠: `matpin.kr로 보내기`, `캡션·댓글·영상`, `역삼역`처럼 실제 맛핀 처리 흐름만 표시했다. 현재 위치 수집이나 여러 장소 자동 저장 같은 범위 밖 약속은 추가하지 않았다.
- 접근성: 하단 탭과 주 행동은 최소 44px, focus-visible 제공, 스와이프 외에도 다음 버튼·건너뛰기·3개 장면 탭을 제공한다. reduced-motion에서는 큰 3D 이동을 제거하고 180ms 상태 전환으로 축약한다.

## Full-view comparison evidence

- `comparison-sheet.jpg`에서 위 행 Poly와 아래 행 맛핀을 `약속 → 콘텐츠 등장 → 입력/단서 → 결과 → 마지막 행동` 순서로 같은 상태끼리 비교했다.
- Poly의 노트북이 사라지며 파일로 handoff되는 원리를 맛핀에서는 작은 핸드폰이 기울어지며 Instagram Reel 카드로 handoff되는 장면으로 치환했다.
- Poly의 검색창 고정 앵커는 맛핀의 `matpin.kr로 보내기` 막대로, 정리된 검색 결과는 역삼역 보관함으로 치환했다.

## Focused region comparison evidence

- `05-matpin-scattered.png`에서 여섯 Reel 카드의 외곽 분산, 카드 회전, 중앙 여백, 하단 dock을 확대 확인했다.
- `02-matpin-clues.png`에서 `matpin.kr로 보내기` 고정 막대와 `캡션·댓글·영상` 단서가 다음 버튼·dock과 겹치지 않는지 확인했다.
- `03-matpin-result.png`에서 같은 테스트 릴스가 역삼역 핸드폰 결과 화면으로 되돌아오는 shared-object 인지를 확인했다.

## Comparison history

1. 첫 구현
   - [P2] 흩어진 카드가 단순 `Reel`로 표시돼 Instagram 콘텐츠라는 구분이 약했다.
   - [P2] 결과 장면에서 제품 핸드폰의 width·height가 상태 변경과 함께 즉시 바뀔 수 있었다.
2. 수정
   - 모든 흩어진 카드의 표기를 `Instagram Reel`로 바꿨다.
   - 결과 장면의 width·height 변경을 제거하고 같은 핸드폰 DOM의 transform·opacity만 이어지게 했다.
3. 최종 비교
   - 5개 대응 상태를 동일 `390 × 844`로 다시 캡처해 합친 뒤 타이포, 간격, 색, 이미지, 카피를 재확인했다.
   - P0/P1/P2 잔여 이슈 없음.

## Primary interactions tested

- 내부 표준 스크롤 컨테이너 `scrollTop 0 → 842`에서 scene `0 → 1` 전환
- `위로 밀어 계속 보기`로 8개 장면 순차 이동
- `건너뛰기`로 마지막 장면 이동
- `보내기`, `장소 찾기`, `역별 영상` 하단 탭 이동
- 마지막 `Instagram에서 matpin.kr 열기` 링크 계약 확인
- 브라우저 콘솔 error 0개
- ESLint, TypeScript, Design Architect UI audit 통과

## Follow-up polish

- [P3] 현재 실제 테스트 릴스 한 장을 여러 위치에 반복해 `같은 릴스가 흩어졌다가 정리됨`을 강조했다. 실제 저장 데이터가 더 생기면 각 카드에 서로 다른 실 릴스 표지를 연결할 수 있다.

final result: passed

---

# 맛핀 02 모바일 프레임 목업 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-native-mobile-options-2026-08-03/02-action-first.png`
- browser-rendered implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-mobile-frame-prototype-2026-08-03/implementation-device-frame.png`
- normalized app screen: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-mobile-frame-prototype-2026-08-03/implementation-screen-send.png`
- full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-mobile-frame-prototype-2026-08-03/qa-comparison.png`
- route: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`
- viewport: browser `1280 × 720`; app-owned CSS screen `390 × 844`; device frame `422 × 876`
- density normalization: source `854 × 1856` and scaled browser crop `272 × 588` were normalized to `390 × 844` for comparison
- state: first onboarding frame, with `릴스 → matpin.kr → 역삼역` cause-and-effect preview

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트·타이포그래피: 원본의 굵은 흰색 제목, 산호색 강조, 짧은 보조 설명 위계를 유지했다. 한글 제목 line-height는 `1.3`, 본문은 `1.55`다.
- 간격·레이아웃: 앱 화면을 `390 × 844`에 고정하고, 상단 앱 바·중앙 제품 미리보기·페이지 표시·카피·56px CTA 순서를 유지했다. 바깥 기기 베젤은 사용자가 요청한 목업 인프라로만 추가했다.
- 색상·토큰: 흑연색 배경과 저대비 표면을 유지하고, 산호색은 보내기 노드·현재 단계·주 CTA에만 사용했다.
- 이미지 품질: 실제 테스트 릴스 `/images/matpick/yeoksam-sanjang-reel.jpg`를 제품 카드와 저장 결과에 사용했다. 생성 시안의 네 개 가상 음식 이미지는 실제 데이터처럼 오해되지 않도록 한 개의 저장 릴스로 축소했다.
- 카피·콘텐츠: `저장하고 싶은 릴스, 그냥 보내세요`, `장소를 찾아 같은 역끼리 모아드려요.`, `Instagram 열기`를 원본과 동일하게 유지했다.
- 접근성: 모든 버튼은 최소 44px, 주 CTA는 56px이며, 단계 버튼에 접근 가능한 이름과 현재 상태가 있다. `prefers-reduced-motion`에서는 전환을 제거한다.

## Full-view comparison evidence

- `qa-comparison.png`에서 원본과 구현을 같은 `390 × 844` 크기로 나란히 확인했다.
- 제품 미리보기, 카피, CTA의 세 구간 비율과 읽기 순서가 유지된다.
- 상태바·다이내믹 아일랜드·홈 인디케이터는 요청한 모바일 프레임 목업에 속하는 의도적 차이다.

## Focused region comparison evidence

- 별도 확대 이미지는 만들지 않았다. 같은 크기의 비교본에서 핵심 제품 미리보기와 CTA 문구가 직접 읽히며, 개별 음식 사진의 내용 일치는 실제 테스트 릴스로 대체한 의도적 제품 계약 차이다.

## Comparison history

1. 첫 구현
   - 2번 시안의 인과 구조를 실제 버튼과 한 개의 테스트 릴스로 구현했다.
   - 외곽에 기기 베젤, 다이내믹 아일랜드, 측면 버튼, 상태바, 홈 인디케이터를 추가했다.
2. 수정
   - [P2] 단계 버튼의 키보드 포커스가 각진 사각형으로 보여 원형 26px 포커스 링으로 교체했다.
   - [P3] 저장 결과 이미지의 LCP 경고를 없애기 위해 우선 로딩을 적용했다.
   - 화면 높이를 시안과 같은 `844px`로 맞췄다.
3. 최종 비교
   - `390 × 844` 모바일 뷰포트에서 문서 가로 overflow 0px, 프레임 하단 `820.14px`로 화면 안에 들어온다.
   - 브라우저 콘솔 오류 0개, ESLint·TypeScript 검사 통과.

## Primary interactions tested

- `다음`으로 릴스 → 보내기 → 역별 저장 전환
- `건너뛰기`로 역삼역 저장 상태 이동
- 단계 표시 버튼으로 장면 선택
- `Instagram 열기`의 `https://www.instagram.com/matpin.kr/` 링크 계약
- `390 × 844` 작은 화면의 프레임 축소와 overflow
- 브라우저 콘솔 오류 확인

## Follow-up polish

- [P3] 실제 iPhone 모델별 안전 영역을 구분해야 할 때는 393×852, 402×874 프리셋을 추가할 수 있다.

final result: passed

---

# MATPIN 모션 실험 03~06 — 짝 비교 프로토타입 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/css-3d/01-share.png`, `02-analyze.png`, `03-station.png`
- 03·04 full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-3-4/qa-contact-sheet.png`
- 05·06 full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-6/qa-contact-sheet.png`
- browser-rendered pair pages: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-3-4/01-share.png`, `02-analyze.png`, `03-saved.png`; `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-6/01-share.png`, `02-analyze.png`, `03-saved.png`
- mobile pair pages: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-3-4/mobile.png`, `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare-5-6/mobile.png`
- individual implementation captures: `docs/research/product-design/matpin-motion-prototypes/individual-03`부터 `individual-06`까지 각 방식의 01-share, 02-analyze, 03-saved
- routes: `http://127.0.0.1:3107/matpin/motion-lab/compare-3-4`, `http://127.0.0.1:3107/matpin/motion-lab/compare-5-6`
- state: 보내기 4%, 장소 확인 46%, 역별 저장 93%, reduced motion 정적 비교
- source pixels: 각 상태 `390 × 844`
- implementation pixels: 각 개별 상태 `390 × 844`; pair desktop `1280 × 720`; pair mobile `390 × 844`
- CSS viewport / density: 개별·모바일 `390 × 844`, deviceScaleFactor `1`; 데스크톱 pair `1280 × 720`, 브라우저 캡처는 CSS 픽셀로 정규화
- density normalization: contact sheet에서 source와 03~06의 개별 렌더를 모두 `390 × 844`로 맞춰 같은 상태를 열별로 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 네 방식 모두 기존 맛핀 한글 sans, 제목 굵기, 1.24 제목 행간, 1.65 본문 행간과 동일 문구를 유지한다. 모션 방식에 따라 글자 크기나 줄바꿈이 달라지지 않는다.
- 간격과 레이아웃: 개별 화면은 같은 `390 × 844` 무대와 `360svh` story를 쓴다. 비교 화면은 정확한 2열과 공용 하단 조작기를 유지하며 390px에서도 가로 overflow 없이 두 화면을 동시에 보여준다.
- 색과 토큰: 검정 무대, 흰 제목, 회색 본문, 산호색 행동 신호를 공통으로 유지한다. 기법 구분은 03 파랑, 04 주황, 05 초록, 06 보라의 3px 진행 선에만 제한했다.
- 이미지 품질과 자산 충실도: 여성 원본과 실제 산장가든 릴스를 네 방식 모두 그대로 사용한다. 04의 H.264 영상도 두 원본 이미지에서 직접 렌더했으며 문구·장소 단서·CTA는 영상에 굽지 않고 DOM으로 유지한다. 가짜 장소나 추가 저장 건수는 만들지 않았다.
- 카피와 콘텐츠: `릴스 보내기 → 장소 확인 → 역별 저장`, `역삼역`, `저장한 영상 1개`가 source와 동일하다. 05·06은 실제 엔진 파일이 없음을 개별 화면과 비교 화면 양쪽에 명시한다.
- 행동과 상태: 공용 슬라이더, 보내기·장소 확인·역별 저장 버튼, 양쪽 iframe 직접 스크롤, 단독 보기 링크가 실제로 동작한다. 03은 Motion DOM track, 04는 0~4초 video scrub, 05는 share/analyze/saved 상태, 06은 camera-like DOM transform을 사용한다.
- 아이콘: 모든 행동 아이콘은 기존 Lucide 라이브러리의 같은 선 굵기를 사용하며 텍스트 없는 링크에는 접근성 이름이 있다.
- 접근성: 모든 버튼과 링크는 44px 이상, focus-visible 3px이다. iframe에 고유 title이 있다. reduced motion에서는 sticky·video scrub·camera movement를 제거하고 세 단계 일반 문서로 바꾸며 공용 조작기를 비활성화하고 이유를 표시한다.
- 엔진 범위: 05와 06은 제품 동작과 장면 계약을 고르는 프로토타입이다. `.riv`와 Spline 장면 원본을 연결하지 않았으므로 실제 엔진의 파일 크기·프레임·편집 편의성 비교 근거로 쓰면 안 된다.

## Full-view comparison evidence

- `compare-3-4/qa-contact-sheet.png`: source, Motion, 사전 렌더 영상을 같은 390×844 세 상태로 배열했다. Motion은 같은 릴스 DOM이 source와 같은 궤적으로 이어지고, 영상 방식은 실사 배경의 연속성이 더 강하지만 중간 릴스 위치가 영상 프레임에 고정되는 차이가 보인다.
- `compare-5-6/qa-contact-sheet.png`: source, Rive 상태 구조, Spline 장면 구조를 같은 세 상태로 배열했다. Rive 구조는 세 상태가 또렷하게 끊기고, Spline 구조는 같은 릴스가 카메라 깊이와 회전을 이어받는 차이가 보인다.
- pair desktop 캡처에서 두 iframe, 현재 퍼센트, 공용 단계가 모두 한 화면에 있으며 46%·93%에서 양쪽 상태가 동기화된다.
- pair mobile 캡처에서 390px 폭에도 두 원본 비율, 단독 보기, 슬라이더, 세 장면 버튼이 잘리지 않는다.

## Focused region comparison evidence

- 별도 확대 crop은 필요하지 않았다. 개별 source와 implementation이 모두 390×844 동일 크기라 contact sheet에서 제목, 단서 카드, 역삼역 저장 카드, 하단 조작기를 원본 크기 기준으로 읽을 수 있다.
- 중간 상태의 문구 겹침은 `compare-5-6/02-analyze.png`와 개별 `individual-05/02-analyze.png`를 다시 확인해 수정 후 사라졌음을 검증했다.

## Comparison history

1. 사전 렌더 영상 첫 프레임
   - [P2] 첫 로드에서 영상 디코딩 전에 여성 사진만 있는 poster가 보여 04의 릴스가 잠시 사라졌다.
   - fix: 실제 MP4의 0.16초 프레임을 `matpin-prerendered-poster.jpg`로 추출해 poster로 연결했다.
   - post-fix evidence: `individual-04/01-share.png`, `compare-3-4/mobile.png`에서 첫 화면부터 실제 릴스가 보인다.
2. Rive 구조 중간 문구 겹침
   - [P2] 05의 첫 문구 클래스가 CSS module에서 export되지 않아 장소 확인 상태에서 첫 문구가 함께 남았다.
   - fix: 05의 세 copy layer에 명시적 module class를 부여해 share/analyze/saved 상태별 opacity를 분리했다.
   - post-fix evidence: `individual-05/02-analyze.png`, `compare-5-6/02-analyze.png`에서 `장소를 확인하고`만 보인다.
3. 최종 비교
   - P0/P1/P2 없음.

## Primary interactions tested

- 03·04, 05·06 공용 `보내기`, `장소 확인`, `역별 저장`: 양쪽 iframe을 4%, 46%, 93%로 동기화
- 공용 range input과 한쪽 직접 스크롤의 동기화 계약 유지
- 네 `단독 보기` 링크와 개별 화면의 세 장면 버튼
- 04 MP4 preload, poster, 0~4초 currentTime scrub
- 05 share/analyze/saved 상태 전환, 06 camera-like depth transform
- 390×844: 두 패널·공용 조작기 가로 overflow 없음
- reduced motion: `정적 비교`, 조작기 disabled, 세 단계 문서 유지
- 브라우저: 개발 서버를 깨끗이 다시 시작한 새 03·04/05·06 탭에서 error 0개, warning 0개
- 정적 검사: TypeScript, 변경 파일 ESLint, Design Architect `audit_ui.py`, project context check 통과

## Follow-up polish

- [P3] 실제 중급 Android와 iPhone Safari에서 MP4 seek의 체감 지연, 두 iframe 동시 동작의 평균 fps와 발열을 측정해야 한다.
- [P3] 05·06 실제 엔진 선택 단계에서는 같은 자산으로 `.riv`와 Spline scene을 만든 뒤 파일 크기, 첫 로드, 스크롤 응답, 편집 비용을 다시 측정해야 한다.

final result: passed

---

# MATPIN 모션 비교실 — 동기 양쪽 보기 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/parallax-2-5d/css3d-vs-parallax-contact-sheet.png`
- browser-rendered implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare/02-desktop-start-fixed.png`, `04-desktop-analyze-fixed.png`, `11-desktop-station-fixed.png`
- mobile implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare/06-mobile-start.png`, `07-mobile-station.png`, `08-mobile-direct-scroll.png`
- reduced motion: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare/10-mobile-reduced-motion-fixed.png`
- full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/compare/13-source-vs-comparison-page.png`
- route: `http://127.0.0.1:3107/matpin/motion-lab/compare`
- state: 보내기 4%, 장소 확인 46%, 역별 저장 93%, 한쪽 직접 스크롤 52%, reduced motion 정적 비교
- source pixels: `1242 × 1736`
- desktop implementation pixels: 각 프레임 `1440 × 1000`
- mobile implementation pixels: 각 프레임 `390 × 844`
- CSS viewport: `1440 × 1000`, `390 × 844`
- deviceScaleFactor: `1`
- density normalization: source는 여섯 개의 `390 × 844` 프로토타입 캡처를 한 장에 배열한 접촉 시트다. implementation은 같은 두 실제 경로를 390 × 844 iframe으로 유지한 채 가용 영역에 동일 비율로 축소한다. `13-source-vs-comparison-page.png`에서 source와 구현의 세 상태 묶음을 같은 1500px 높이로 정규화해 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 비교실 제목·기법명·설명·조작부는 기존 맛핀의 한국어 폰트 스택을 유지한다. 데스크톱에서 제목 18~24px, 모바일 15~17px이며 줄바꿈 없이 한 줄로 읽힌다. iframe 안의 원본 타이포그래피는 변경하지 않고 동일 비율로 축소된다.
- 간격과 레이아웃: 두 프로토타입을 정확히 같은 너비의 2열로 배치한다. 페이지는 `100svh` 한 화면이고 헤더·양쪽 화면·공용 조작부가 동시에 남는다. 390px에서는 각 iframe의 390 × 844 비율을 유지해 약 45%로 축소하며 가로 overflow가 없다.
- 색과 토큰: 기존 맛핀의 검정 배경, 흰 텍스트, 회색 보조 텍스트, 산호색 진행 신호를 그대로 사용한다. 동기 상태는 초록 점 하나로만 구분하고 새 장식 색이나 시각 효과를 넣지 않았다.
- 이미지 품질과 자산 충실도: 실제 CSS 3D·2.5D 경로를 iframe으로 직접 표시하므로 여성 광고 원본과 릴스 대표 이미지가 복제·대체되지 않는다. 코드로 만든 가짜 이미지나 자리표시자는 없다.
- 카피와 콘텐츠: 화면 목적을 `같은 장면으로 비교해보세요.`로 명확히 말한다. `CSS 3D / 원근과 회전`, `2.5D 패럴랙스 / 레이어 속도 차이`만 추가하고 제품 약속이나 저장 개수는 바꾸지 않았다.
- 아이콘: 돌아가기와 단독 보기는 프로젝트에서 이미 사용하는 Lucide 아이콘으로 통일했다. 아이콘만 보이는 모바일 단독 보기에는 각 기법명이 포함된 접근성 이름을 제공한다.
- 행동과 상태: 공용 슬라이더, 세 장면 버튼, 한쪽 직접 스크롤이 두 iframe을 같은 story 진행률로 이동시킨다. 각 `단독 보기`는 실제 기존 경로로 이동한다.
- 모바일 의도적 제약: 390px에서 원본 화면 속 작은 본문은 읽기보다 모션 궤적 비교에 맞게 축소된다. 이는 동시에 두 화면을 보여 달라는 과업의 제약이며, 자세한 읽기는 각 패널의 `단독 보기`로 보완한다.
- 접근성: 공용 제어와 단독 보기의 터치 영역은 최소 44px이다. 키보드 focus-visible과 고유 iframe 제목이 있다. reduced motion에서는 두 동적 무대를 정적 3단계로 바꾸고, 의미가 사라진 슬라이더·장면 버튼을 비활성화하면서 이유를 설명한다.

## Full-view comparison evidence

- `13-source-vs-comparison-page.png`의 왼쪽은 CSS 3D와 2.5D의 원본 여섯 프레임, 오른쪽은 실제 비교실의 시작·분석·저장 세 상태다. 원본의 장면·카피·이미지·최종 저장 위치가 양쪽 iframe에 그대로 유지된다.
- 비교실에서는 두 방식의 차이만 보이도록 패널 크기, 프레임 크기, 진행률을 같게 유지한다. 첫 장면의 기울기 차이, 중간 장면의 단서 이동 차이, 최종 저장 장면을 동시에 확인할 수 있다.

## Focused region comparison evidence

- `04-desktop-analyze-fixed.png`: 두 iframe을 충분한 크기로 보여 릴스 회전, 단서 카드 위치, 제목, 공용 46% 상태를 읽을 수 있다.
- `07-mobile-station.png`: 390px에서도 두 역삼역 보관함과 93% 상태, 세 장면 버튼, 단독 보기 링크가 잘리지 않는다.
- `08-mobile-direct-scroll.png`: 왼쪽 화면을 직접 스크롤한 뒤 양쪽이 같은 장소 확인 상태로 이동하고 공용 진행률이 52%로 갱신된다.
- `10-mobile-reduced-motion-fixed.png`: 두 iframe이 동일한 정적 세 단계로 바뀌고 비교 조작부가 비활성 상태와 이유를 함께 보여준다.

## Comparison history

1. 한 화면 높이
   - [P2] 첫 캡처에서 페이지가 viewport보다 100px 길어져 상단 제목이 화면 밖으로 밀렸다.
   - fix: 비교 페이지를 `height: 100svh`로 고정하고 내부 grid만 남은 높이를 나눠 갖게 했다.
   - post-fix evidence: `02-desktop-start-fixed.png`에서 제목, 두 패널, 조작부가 `1440 × 1000` 안에 함께 보이고 outer `scrollY: 0`, `scrollHeight: 1000`을 확인했다.
2. iframe 초기 연결
   - [P1] 공용 버튼의 퍼센트만 바뀌고 두 iframe이 첫 장면에 남았다. 캐시된 iframe이 React `onLoad` 연결 전에 로드될 수 있었다.
   - fix: iframe ref를 mount 즉시 등록하고 이후 `load` 이벤트에도 다시 등록하게 했다.
   - post-fix evidence: `04-desktop-analyze-fixed.png`에서 양쪽 모두 장소 확인 장면으로 바뀌고 부모 진행률이 46%다.
3. 진행률 기준
   - [P1] 93%를 전체 문서 높이로 계산해 마지막 저장 장면이 아니라 후속 설명 섹션으로 이동했다.
   - fix: 실제 scroll story에 `data-motion-story`를 부여하고 그 섹션의 `offsetTop`과 travel만으로 진행률을 계산했다.
   - post-fix evidence: `11-desktop-station-fixed.png`와 `07-mobile-station.png`에서 양쪽 모두 역삼역 보관함 장면에 멈춘다.
4. reduced motion의 죽은 조작부
   - [P2] 정적 fallback에서는 슬라이더·장면 버튼을 눌러도 시각 변화가 없어 의미 없는 조작처럼 보였다.
   - fix: reduced motion을 감지해 `정적 비교` 상태와 이유를 표시하고 해당 제어를 비활성화했다.
   - post-fix evidence: `10-mobile-reduced-motion-fixed.png`와 비활성 제어 4개를 확인했다.
5. 최종 비교
   - P0/P1/P2 없음.

## Primary interactions tested

- 공용 `보내기`, `장소 확인`, `역별 저장`: 두 iframe을 실제 story 4%, 46%, 93%로 함께 이동
- 한쪽 직접 스크롤: 왼쪽 iframe을 93%에서 52%로 스크롤했을 때 오른쪽 iframe과 공용 슬라이더가 같은 상태로 갱신
- 공용 range input: 진행률 상태와 native accent control 확인
- `단독 보기`: CSS 3D와 2.5D의 실제 기존 경로를 유지
- 1440 × 1000: 제목·두 패널·조작부 동시 노출, outer scroll 없음
- 390 × 844: `scrollWidth: 390`, `scrollHeight: 844`, 두 프로토타입 동시 노출
- reduced motion: 정적 세 단계 노출, 동기 제어 비활성, 이유 설명
- 브라우저 로그: error 0개, warning 0개. React DevTools와 Fast Refresh의 개발용 info/log만 존재
- 정적 검사: TypeScript, 변경 파일 ESLint, Design Architect `audit_ui.py`, project context check, `git diff --check` 통과

## Follow-up polish

- [P3] 실제 iPhone Safari와 중급 Android Chrome에서 iframe 두 개 동시 스크롤의 평균 프레임과 발열을 측정해야 한다.
- [P3] 360px 이하에서는 각 원본 화면의 작은 본문을 읽기 어렵다. 비교 목적은 유지되지만 자세한 문구 확인에는 `단독 보기`가 필요하다.

final result: passed

---

# MATPIN 모션 실험 02 — 2.5D 패럴랙스 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/css-3d/01-share.png`, `02-analyze.png`, `03-station.png`
- browser-rendered implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/parallax-2-5d/01-share.png`, `02-analyze.png`, `03-station.png`
- reduced motion: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/parallax-2-5d/04-reduced-motion.png`
- small mobile: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/parallax-2-5d/05-small-320.png`
- full-view comparison evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/parallax-2-5d/css3d-vs-parallax-contact-sheet.png`
- route: `http://127.0.0.1:3107/matpin/motion-lab/parallax-2-5d`
- state: 보내기 4%, 장소 확인 46%, 역별 저장 93%, reduced motion 정적 흐름
- source pixels: CSS 3D 프레임 각각 `390 × 844`
- implementation pixels: 2.5D 프레임 각각 `390 × 844`, 작은 화면 `320 × 700`
- CSS viewport: `390 × 844`, `320 × 700`
- deviceScaleFactor: `1`
- density normalization: source와 implementation을 같은 CSS 크기와 같은 픽셀 밀도로 캡처했다. 접촉 시트에서는 두 실험을 동일한 폭으로 정렬해 구도와 객체 이동만 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 공유 컴포넌트의 한국어 제목·본문·하단 단계 표시를 그대로 사용해 두 실험의 글자 크기, 굵기, 행간, 줄바꿈이 일치한다. 2.5D 전환은 글자 레이어에 transform을 적용하지 않아 읽기 안정성이 유지된다.
- 간격과 레이아웃: 같은 `100svh` 무대와 `360svh` 표준 페이지 스크롤을 사용한다. 하단 단계 버튼, 안전 여백, 저장 보관함의 크기와 위치는 CSS 3D 버전과 동일하다.
- 색과 토큰: 검정 배경, 흰 제목, 회색 본문, 산호색 진행 신호가 동일하다. 깊이 차이는 그림자나 새 색이 아니라 레이어별 이동 거리로만 표현했다.
- 이미지 품질: 기존 여성 광고 원본과 실제 저장 릴스 대표 이미지를 그대로 사용한다. 새 가짜 장소 카드나 복제된 릴스는 추가하지 않았다.
- 카피와 콘텐츠: `릴스 보내기 → 장소 확인 → 역별 저장`의 문구와 실제 저장 결과 1개를 유지했다. 실험 기법 외의 제품 약속은 바꾸지 않았다.
- 의도적 차이: 2.5D 버전은 perspective, `rotateY`, `rotateZ`, `translateZ`를 제거했다. 배경은 약 16px, 중심 릴스는 중간 거리, 단서 카드는 약 40~58px 이동해 평면 위의 깊이만 만든다. CSS 3D보다 극적인 입체감은 줄지만 릴스 텍스트가 정면으로 유지된다.
- 접근성: `prefers-reduced-motion: reduce`에서는 sticky 패럴랙스를 숨기고 동일한 세 단계와 실제 Instagram CTA를 정적 문서로 제공한다.

## Full-view comparison evidence

- `css3d-vs-parallax-contact-sheet.png`의 위 행은 CSS 3D, 아래 행은 2.5D 패럴랙스다. 세 프레임 모두 정보 순서, 주인공 릴스, 마지막 저장 결과가 동일하다.
- 첫 장면에서 2.5D 릴스는 기울지 않아 영상 제목을 빠르게 읽을 수 있다. 중간 장면에서는 앞쪽 단서 카드가 배경과 중심 릴스보다 더 움직여 깊이를 구분한다. 마지막 장면은 같은 저장 슬롯에 같은 릴스가 도착한다.

## Focused region comparison evidence

- 별도 확대 비교는 필요하지 않았다. source와 implementation이 모두 `390 × 844` 원본 크기이고 접촉 시트에서 제목, 릴스 텍스트, 단서 카드, 하단 버튼을 읽을 수 있었다.
- `05-small-320.png`에서는 제목과 릴스가 320px 폭 안에 유지되고 document `scrollWidth: 320px`를 확인했다.
- `04-reduced-motion.png`에서는 모션 무대 대신 세 단계 정적 설명이 노출되는 것을 확인했다.

## Comparison history

1. 기법 분리
   - 이전 CSS 3D 실험의 카피나 콘텐츠가 달라지면 모션 방식만 비교할 수 없다.
   - fix: 같은 컴포넌트와 실제 이미지·데이터를 공유하고 `mode`별 transform만 분리했다.
   - post-fix evidence: 접촉 시트에서 두 행의 제목, 이미지, 저장 결과, 하단 내비게이션이 일치한다.
2. 첫 전체 비교
   - P0/P1/P2 없음. 시각 수정 없이 통과했다.

## Primary interactions tested

- `보내기`, `장소 확인`, `역별 저장` 버튼: 각각 4%, 46%, 93% 위치로 표준 페이지 스크롤 이동
- 패럴랙스: 배경·중심 릴스·앞쪽 단서가 서로 다른 x/y 이동 거리를 사용하고 perspective 회전 없음
- 객체 인계: 동일한 릴스 DOM 객체가 마지막 역삼역 첫 슬롯에 안착
- 390 × 844와 320 × 700: 가로 overflow 없음, sticky 무대 내부 `scrollTop: 0`
- reduced motion: 패럴랙스 무대 숨김, 세 단계 정적 설명과 실제 Instagram CTA 유지
- 브라우저 로그: error 0개, warning 0개
- 정적 검사: TypeScript와 변경 파일 ESLint 통과

## Follow-up polish

- [P3] 실제 iPhone Safari와 중급 Android Chrome에서 왕복 스크롤의 평균 프레임과 발열을 측정해야 한다.
- [P3] 2.5D의 깊이는 의도적으로 약하다. 사용자 비교에서 밋밋하다는 반응이 나오면 앞쪽 단서 카드의 이동 거리만 10~15% 높일 수 있다.

final result: passed

---

# MATPIN 모션 실험 01 — CSS 3D 스크롤 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/poly-landing-audit-2026-08-02/01-hero.png`, `05-analyze.png`, `09-discover-result.png`
- implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/css-3d/01-share.png`, `02-analyze.png`, `03-station.png`
- reduced motion: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/css-3d/04-reduced-motion.png`
- small mobile: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/css-3d/05-small-320.png`
- combined comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/product-design/matpin-motion-prototypes/css-3d/poly-vs-matpin-contact-sheet.png`
- route: `http://127.0.0.1:3107/matpin/motion-lab/css-3d`
- state: 보내기 4%, 장소 확인 46%, 역별 저장 93%, reduced motion 정적 흐름
- source pixels: Poly 프레임 각각 `1440 × 1024`
- implementation pixels: 각 프레임 `390 × 844`, 작은 화면 `320 × 700`
- CSS viewport: `390 × 844`, `320 × 700`
- density normalization: Poly는 데스크톱 레퍼런스라 모바일 구현과 픽셀 일치를 판정하지 않았다. 같은 접촉 시트에서 `약속 → 입력 → 결과`, 안정 앵커, 한 무대의 상태 변화만 비교했다. 구현 프레임끼리는 같은 viewport와 동일 데이터로 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 한국어 제목을 31~45px, 본문을 11~13px로 두고 최소 1.5 이상의 행간을 유지했다. 제목은 3D 원근 밖의 안정 레이어라 320px와 390px 모두 잘리지 않는다.
- 간격과 레이아웃: 하나의 `100svh` 무대를 `360svh` 표준 스크롤로 진행한다. 하단 세 장면 버튼은 44px 이상이고, 내부 스크롤 없이 페이지 스크롤만 움직인다.
- 색과 토큰: 현재 맛핀의 검정 배경, 흰 제목, 회색 설명, 산호색 행동 신호를 유지했다. Poly의 목재 질감과 색은 복제하지 않았다.
- 이미지 품질: 기존 여성 광고 원본과 실제 저장 릴스 대표 화면을 사용했다. 릴스는 세 장면에서 같은 DOM 객체로 유지되고, 별도 사본으로 교체되지 않는다.
- 카피와 콘텐츠: `릴스 보내기 → 캡션·댓글·영상 단서 확인 → Instagram 아이디 기준 역별 저장`으로 현재 맛핀 계약을 설명한다. 지도 중심 언어는 다시 넣지 않았다.
- 접근성: `prefers-reduced-motion: reduce`에서는 sticky·parallax·3D를 제거하고 동일한 세 단계를 일반 문서 흐름과 실제 Instagram CTA로 제공한다.

## Full-view comparison evidence

- `poly-vs-matpin-contact-sheet.png` 상단은 Poly의 약속·입력·결과, 하단은 맛핀의 보내기·분석·역별 저장이다. 두 흐름 모두 새 페이지로 잘라 이동하지 않고 같은 무대와 중심 객체를 유지한다.
- Poly의 중심 검색창 역할을 맛핀에서는 동일한 릴스 카드가 맡는다. 배경과 설명은 바뀌지만 중심 객체의 정체성은 끝까지 유지된다.

## Focused region comparison evidence

- `01-share.png`: 제목은 원근 왜곡 없이 고정되고, 여성·휴대폰·릴스·공유 카드만 깊이를 가진다.
- `02-analyze.png`: 캡션·댓글·영상 단서가 중앙 릴스 주변에 모이며 제목을 가리지 않는다.
- `03-station.png`, `05-small-320.png`: 동일 릴스가 역삼역 첫 슬롯 안에 안착한다. 320px에서도 가로 overflow가 없고 하단 장면 버튼과 겹치지 않는다.

## Comparison history

1. 첫 장면
   - [P2] 제목에도 `translateZ`가 적용되어 390px 화면 왼쪽에서 글자가 잘렸다.
   - fix: 제목을 카메라 원근 밖의 안정 레이어로 이동했다.
   - post-fix evidence: `01-share.png`에서 제목 전체가 22px 좌우 여백 안에 보인다.
2. 중간 장면
   - [P2] 장면 버튼 선택 뒤 sticky 무대의 내부 `scrollTop`이 92.5px가 되어 헤더가 화면 위로 밀렸다.
   - fix: 무대의 `overflow: hidden`을 내부 스크롤 컨테이너가 되지 않는 `overflow: clip`으로 바꿨다.
   - post-fix evidence: 장소 확인 장면에서 stage `scrollTop: 0`, header top `14px`를 확인했다.
3. 마지막 장면
   - [P2] 320px 화면에서 고정 좌표를 사용한 릴스 카드가 저장 슬롯과 하단 버튼을 침범했다.
   - fix: 최종 x·y·scale을 현재 stage 폭과 높이로 계산하도록 바꿨다.
   - post-fix evidence: `05-small-320.png`에서 카드가 첫 슬롯에 들어가고 document `scrollWidth: 320px`를 유지한다.
4. 최종 비교
   - P0/P1/P2 없음.

## Primary interactions tested

- `장소 확인` 버튼: 표준 페이지 스크롤을 46% 지점으로 이동, 무대 내부 스크롤 0 유지
- `역별 저장` 버튼: 93% 지점으로 이동, 동일 릴스가 역삼역 첫 슬롯에 안착
- 390 × 844와 320 × 700: 가로 overflow 없음, 헤더·카피·장면 버튼 유지
- reduced motion: 3D 무대 숨김, 세 단계 정적 설명과 실제 Instagram CTA 유지
- 브라우저 로그: error 0개, warning 0개
- 정적 검사: TypeScript와 변경 파일 ESLint 통과

## Follow-up polish

- [P3] 실제 iPhone Safari와 중급 Android Chrome에서 긴 스크롤을 왕복하며 평균 프레임과 발열을 한 번 측정해야 한다.
- [P3] 개발 환경 왼쪽 아래 Next.js `N` 버튼은 배포 화면에 포함되지 않는다.

final result: passed

---

# MATPIN 페이지 3 — 릴스 상세 화면 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/creme-01-detail.jpg`
- first-pass implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-03-detail-before-2026-08-02.jpg`
- final implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-03-detail-after-2026-08-02.jpg`
- before comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-03-qa/before-comparison.jpg`
- final comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-03-qa/after-comparison.jpg`
- route: `http://127.0.0.1:3107/matpin/reel/DbTBhcZNY1b?station=역삼역&preview=station-reels#token=local-preview`
- state: 모바일 개발 미리보기, 산장장작구이 릴스, 재생 전, 공유 전
- source pixels: `299 × 678`
- implementation pixels: `390 × 844`
- CSS viewport: `390 × 844`
- density normalization: Crème 레퍼런스를 높이 844px로 맞춘 뒤 검정 여백으로 390 × 844 캔버스에 가운데 정렬했다. 구현은 브라우저가 CSS viewport 크기로 반환한 390 × 844 캡처다. 두 화면 모두 44px 라벨을 붙여 하나의 비교 이미지에 배치했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 장소명을 원본 영상 밖의 전용 영역에 28px 이상으로 표시한다. 역명과 작성자는 12~13px 보조 정보로 두어 Crème의 `콘텐츠 → 제목 → 작성자` 위계를 유지했다.
- 간격과 레이아웃: 영상 높이를 608px에서 422px로 줄였다. 첫 화면 안에서 영상, 장소명, 작성자, 네 가지 핵심 행동, 추출 근거와 장소 정보 시작점을 모두 확인할 수 있다.
- 색과 토큰: Crème의 어두운 상세 구조를 유지하면서 맛핀의 주황색을 원본 릴스 행동과 역 정보에만 사용했다. 나머지 행동은 검정 표면과 흰 아이콘으로 절제했다.
- 이미지 품질: 실제 저장된 릴스 영상과 커버를 그대로 사용한다. 영상에 포함된 원본 자막을 삭제하거나 가짜 프레임으로 바꾸지 않았다.
- 카피와 콘텐츠: `영상의 간판과 메뉴에서 확인한 장소예요.`를 행동 바로 아래에 배치해 왜 이 장소가 저장됐는지 설명한다. 같은 문장을 상세 카드에서 반복하지 않는다.
- 의도적 차이: Crème의 Cook·Plan·Remix·Ask를 맛핀의 실제 행동인 원본 릴스·길찾기·공유·장소 정보로 치환했다. 레시피 시간 정보는 맛핀에 대응 데이터가 없어 복제하지 않았다.

## Full-view comparison evidence

- `before-comparison.jpg`: 영상 자체의 큰 한글 자막 위에 장소명이 겹쳐 두 텍스트 모두 읽기 어렵다. 영상이 길어 핵심 행동과 상세 정보도 늦게 시작한다.
- `after-comparison.jpg`: 원본 영상은 독립된 증거 영역으로 남고, 그 아래에 장소명과 네 가지 행동이 Crème과 같은 순서로 이어진다.

## Focused region comparison evidence

- 별도 확대 이미지는 만들지 않았다. 최종 비교가 구현 폭 390px를 유지해 제목, 작성자, 네 버튼, 추출 근거와 다음 섹션 제목이 모두 읽히는 크기다.

## Comparison history

1. 첫 비교
   - [P1] 장소명 `산장장작구이`가 릴스 자체 자막 `강남에서 줄서는 인생 껍데기 삼겹`과 같은 위치에 겹쳤다.
   - fix: 장소명·역명·작성자를 영상 밖의 전용 요약 영역으로 이동했다. 저장 상태는 Crème처럼 우측 상단 하트 아이콘으로 압축했다.
   - post-fix evidence: `matpin-page-03-detail-after-2026-08-02.jpg`에서 원본 자막과 제품 제목이 서로 다른 영역에 표시된다.
2. 첫 화면 밀도
   - [P2] 영상 높이가 608px라 네 가지 핵심 행동만 보이고 장소 추출 근거는 첫 화면 밖에 있었다.
   - fix: 영상 높이를 모바일 화면의 50svh, 최소 420px로 조정하고 빈 공유 피드백 공간을 제거했다.
   - post-fix evidence: 최종 캡처에서 행동 버튼 아래 추출 근거와 장소 정보 시작점까지 보인다.
3. 최종 비교
   - P0/P1/P2 없음.
   - 390px viewport에서 document width는 390px이며 가로 overflow가 없다.

## Primary interactions tested

- 원본 릴스 링크: 실제 Instagram 릴스 URL 확인
- 길찾기 링크: 산장장작구이 Google Maps URL 확인
- 장소 정보 버튼: 페이지가 296px 스크롤되고 장소 상세 영역이 화면에 표시됨
- 뒤로가기: 개인 토큰과 선택 역을 유지한 `/matpin/station/역삼역` 복귀
- 접근성 구조: 단일 h1, 이름이 있는 저장 상태, 네 가지 행동과 장소 길찾기 확인
- 브라우저 로그: 새 탭에서 error 0개, warning 0개
- 정적 검사: TypeScript, ESLint, UI audit 통과
- 단위 테스트: Matpin 36개 통과

## Follow-up polish

- [P3] iOS와 Android의 실제 공유 시트 완료 상태는 배포 뒤 실기기에서 각각 한 번 확인할 수 있다.
- [P3] 원본 영상의 자막이 재생 컨트롤과 겹치는 경우 Instagram이 제공하는 다른 실제 대표 프레임을 고르는 후처리를 추가할 수 있다.

final result: passed

---

# MATPIN 페이지 2 — 역별 보관함 첫 화면 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/canopi-03-result-list.jpg`
- first-pass implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-02-saved-before-2026-08-02.jpg`
- final implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-02-saved-after-2026-08-02.jpg`
- before comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-02-qa/before-comparison.jpg`
- final comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-02-qa/after-comparison.jpg`
- route: `http://127.0.0.1:3107/matpin/saved?preview=station-reels#token=local-preview`
- state: 모바일 개발 미리보기, 역삼역 1개, 저장 영상 3개, 검색어 없음
- source pixels: `299 × 678`
- implementation pixels: `390 × 844`
- CSS viewport: `390 × 844`
- density normalization: Canopi 레퍼런스를 높이 844px로 맞춘 뒤 검정 여백으로 390 × 844 캔버스에 가운데 정렬했다. 구현은 브라우저가 CSS viewport 크기로 반환한 390 × 844 캡처다. 두 화면 모두 44px 라벨을 붙여 하나의 비교 이미지에 배치했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: Canopi의 짧은 상단 제목과 묶음 제목 위계를 `저장한 역 → 가까운 역 → 역삼역`으로 옮겼다. 앱 제목은 32px 이상, 역 제목은 25px, 영상 이름은 13px이며 한 줄 말줄임을 유지한다.
- 간격과 레이아웃: 첫 영상 시작 위치를 viewport 상단 538px에서 369px로 올렸다. 역마다 세 개의 영상 미리보기가 Canopi의 항목별 미리보기처럼 같은 화면 안에서 한 줄로 보인다.
- 색과 토큰: 제품이 잠근 검정 배경과 흰 글자, 회색 보조 정보, 주황 위치 신호를 유지했다. Canopi의 밝은 색은 복제하지 않고 정보 구조와 밀도만 참조했다.
- 이미지 품질: 실제 저장된 Instagram 릴스 대표 화면을 사용한다. 미리보기는 왜곡 없이 4:5로 자르고, 가짜 이미지나 코드로 만든 그래픽을 추가하지 않았다.
- 카피와 콘텐츠: 질문형 `어느 역에서 찾으세요?`를 현재 상태를 바로 설명하는 `저장한 역`으로 바꿨다. 같은 `역삼역`을 반복하던 최근 본 역 칩은 삭제했다.
- 의도적 차이: 역·가게 검색은 저장 수가 늘어날 때 필요한 실제 기능이라 유지했다. Canopi의 `Next/Past` 탭과 추가 버튼은 맛핀에 대응하는 실제 행동이 없어 복제하지 않았다.

## Full-view comparison evidence

- `before-comparison.jpg`: 큰 질문형 제목, 검색, 최근 본 역, 다시 역 제목이 이어져 같은 역이 반복되고 첫 영상이 viewport 아래에서 시작한다.
- `after-comparison.jpg`: Canopi처럼 짧은 페이지 제목 아래에 하나의 묶음 제목과 미리보기 행이 이어진다. 첫 화면 안에서 역삼역과 저장 영상 세 개를 모두 확인할 수 있다.

## Focused region comparison evidence

- 별도 확대 이미지는 만들지 않았다. 최종 비교가 구현 폭 390px를 그대로 유지해 제목, 검색, 역 묶음, 세 개 미리보기와 영상 이름이 모두 읽힌다.

## Comparison history

1. 첫 비교
   - [P1] 최근 본 역 칩과 실제 역 묶음에서 `역삼역`이 반복되고 첫 카드가 상단 538px에서 시작해 핵심 콘텐츠 진입이 늦었다.
   - fix: 최근 본 역 영역을 삭제하고 질문형 두 줄 제목을 한 줄 상태 제목 `저장한 역`으로 압축했다.
   - post-fix evidence: `matpin-page-02-saved-after-2026-08-02.jpg`에서 역 묶음이 298px, 첫 영상이 369px에서 시작한다.
2. 미리보기 행
   - [P2] 기존 가로 레일은 세 번째 영상이 화면 밖으로 잘려 현재 역에 영상이 몇 개 있는지 한눈에 보기 어려웠다.
   - fix: 최대 세 개 대표 영상을 3열 미리보기로 배치하고 `Reel` 배지와 중복 역 이름을 제거했다. 영상 재생 버튼과 장소명은 유지했다.
   - post-fix evidence: `after-comparison.jpg`에서 세 영상이 같은 행 안에 모두 보인다.
3. 최종 비교
   - P0/P1/P2 없음.
   - 390px viewport와 320px viewport 모두 document width가 viewport와 같아 가로 overflow가 없다.

## Primary interactions tested

- 검색어 `치솟` 입력: 영상 3개 → 치솟 역삼본점 1개
- 검색어 지우기: 영상 3개 복귀
- 역삼역 묶음 선택: `/matpin/station/역삼역` 이동
- 뒤로가기: 개인 토큰과 미리보기 상태를 유지한 보관함 복귀
- 390 × 844와 320 × 700 모바일 viewport 가로 overflow 확인
- 브라우저 로그: 새 탭에서 error 0개, warning 0개
- 정적 검사: TypeScript, ESLint, UI audit 통과
- 단위 테스트: Matpin 36개 통과

## Follow-up polish

- [P3] 저장 영상이 네 개 이상인 역은 대표 세 개만 보이고 `영상 n개`를 눌러 전체 역 화면에서 확인한다.
- [P3] 개발 환경 왼쪽 아래의 Next.js `N` 버튼은 개발 도구 표시이며 배포 화면에는 포함되지 않는다.

final result: passed

---

# MATPIN 페이지 1 — 역 상세 영상 목록 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/creme-03-saved-grid.jpg`
- first-pass implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-01-station-before-2026-08-02.png`
- final implementation: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-01-station-after-2026-08-02.png`
- before comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-01-qa/before-comparison.jpg`
- final comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-page-01-qa/after-comparison.jpg`
- route: `http://127.0.0.1:3107/matpin/station/역삼역?preview=station-reels#token=local-preview`
- state: 모바일 개발 미리보기, 역삼역, 저장 영상 3개, 전체 필터 선택
- source pixels: `299 × 678`
- implementation pixels: `390 × 844`
- CSS viewport: `390 × 844`
- density normalization: 레퍼런스를 높이 844px로 맞춘 뒤 검정 여백으로 390 × 844 캔버스에 가운데 정렬했다. 구현은 브라우저가 CSS viewport 크기로 반환한 390 × 844 캡처를 사용했다. 두 화면 모두 44px 라벨을 붙여 같은 비교 이미지에 배치했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 역 이름은 한 번만 18px 제목으로 노출한다. 영상 이름은 14px, 역 정보는 12px로 Crème의 짧은 카드 제목 위계를 한국어에 맞춰 유지했다.
- 간격과 레이아웃: 첫 영상 카드의 시작 위치를 viewport 상단 315px 부근에서 142px로 끌어올렸다. 레퍼런스와 같이 화면 초반부터 2열 영상 그리드가 보인다.
- 색과 토큰: 역 화면은 순수 검정 배경, 흰 제목, 회색 보조 정보로 맞췄다. 맛핀의 주황색은 위치 아이콘에만 남겼다.
- 이미지 품질: 실제 저장된 Instagram 릴스 대표 화면 세 장을 그대로 사용했다. 가짜 음식 이미지나 코드로 만든 대체 이미지는 없다.
- 카피와 콘텐츠: 중복되던 `맛집 릴스 보관함 / 역삼역 / 설명` 묶음을 삭제했다. 실제 거리 값이 없는 미리보기는 거짓 도보 시간을 만들지 않고 `역삼역 근처`라고 표시한다.
- 의도적 차이: 카테고리 필터와 영상명·역 정보는 맛핀의 탐색 과업에 필요해 유지했다. Crème의 하단 탭은 연결할 실제 기능이 없어 복제하지 않았다.

## Full-view comparison evidence

- `before-comparison.jpg`: 중복된 대형 역 제목과 설명 때문에 영상 선택이 레퍼런스보다 크게 늦게 시작한다.
- `after-comparison.jpg`: 뒤로가기와 한 줄 제목 아래에 필터와 2열 영상이 바로 이어지며, 양쪽 화면의 첫 카드 시작선과 카드 비율이 가까워졌다.

## Focused region comparison evidence

- 별도 확대 이미지는 만들지 않았다. 최종 비교가 원본 구현 폭 390px를 그대로 유지해 상단 제목, 필터, 카드 모서리, 영상명과 역 정보가 모두 읽히는 크기다.

## Comparison history

1. 첫 비교
   - [P1] 역 이름과 설명이 상단에서 두 번 반복되어 핵심인 영상 선택이 viewport 상단 약 315px 뒤에 시작했다.
   - fix: 대형 hero를 삭제하고 뒤로가기·역명·영상 수를 한 줄 헤더로 통합했다.
   - post-fix evidence: `matpin-page-01-station-after-2026-08-02.png`에서 첫 카드가 상단 142px에 시작한다.
2. 카드 정보 밀도
   - [P2] 모든 카드에 `Reel` 배지, 재생 버튼, 장소명, 역명, 카테고리, 화살표가 함께 보여 Crème보다 카드 주변이 복잡했다.
   - fix: `Reel` 배지, 중복 카테고리, 화살표를 제거하고 장소명과 역 정보만 남겼다. 영상임을 알리는 재생 버튼은 유지했다.
   - post-fix evidence: `after-comparison.jpg`에서 카드 아래 정보가 두 줄로 정리됐다.
3. 최종 비교
   - P0/P1/P2 없음.
   - 390px viewport에서 document width는 390px이며 가로 overflow가 없다.

## Primary interactions tested

- `전체 → 일식 → 전체` 필터: 영상 3개 → 1개 → 3개 전환
- 첫 카드 `산장장작구이` 선택: `/matpin/reel/DbTBhcZNY1b` 상세로 이동
- 상세 뒤로가기: 현재 역 이름과 개인 토큰을 유지한 역 목록 URL 확인
- 접근성 구조: 단일 h1 `역삼역`, 이름이 있는 필터 버튼, 이름이 있는 영상 링크 확인
- 브라우저 로그: error 0개, warning 0개
- 정적 검사: TypeScript, ESLint, UI audit 통과
- 단위 테스트: Matpin 36개 통과

## Follow-up polish

- [P3] 개발 환경 왼쪽 아래의 Next.js `N` 버튼은 개발 도구 표시이며 배포 화면에는 포함되지 않는다.
- [P3] 실제 역 거리 계산이 가능한 저장 건은 `역삼역 근처` 대신 `도보 약 n분`으로 자동 표시된다.

final result: passed

---

# MATPIN 역별 릴스 보관함 전체 다크 플로우 Design QA

## 비교 대상

- source visual truth 1: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/canopi-03-result-list.jpg`
- source visual truth 2: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/creme-03-saved-grid.jpg`
- source visual truth 3: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/creme-01-detail.jpg`
- landing screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-landing-2026-08-02.png`
- library screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-home-final-2026-08-02.png`
- station screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-station-2026-08-02.png`
- detail screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-detail-final-2026-08-02.png`
- home comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-qa/home-comparison.png`
- station comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-qa/station-comparison.png`
- detail comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-dark-flow-qa/detail-comparison.png`
- routes: `/matpin`, `/matpin/saved`, `/matpin/station/[station]`, `/matpin/reel/[reel]`, `/matpin/search`, `/matpin/confirm`, `/matpin/delete`
- state: 모바일 개발 미리보기, 역삼역 1개, 서로 다른 실제 공개 Instagram 릴스 3개, 검색·필터 없음
- source pixels: Canopi와 Crème 화면 각각 `299 × 678`
- implementation pixels: 각 화면 `390 × 844`
- CSS viewport: `390 × 844`, 브라우저 보고 device pixel ratio `2`
- density normalization: 레퍼런스는 높이 `844px`로 맞추고 구현은 브라우저가 CSS 크기로 정규화한 캡처를 사용했다. 각 비교 이미지는 상단 44px 라벨을 추가한 `762 × 888`이다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: 첫 질문 34px 이상, 역 제목 38px 이상, 카드 제목 14px, 보조 정보 12px로 정리했다. 모든 일반 본문은 1.5 이상 행간을 유지하고 12px 미만 메타데이터를 제거했다.
- 간격과 레이아웃: Canopi의 `컬렉션 제목 → 관련 항목` 반복을 `역 제목 → 릴스 레일`로 옮겼다. 역 화면은 Crème 저장 화면처럼 실제 음식 영상이 먼저 보이는 2열 그리드다.
- 색과 토큰: 랜딩·보관함·역 목록·상세·저장 확인·삭제 화면을 `#08090b` 기반 다크 토큰, 흰 제목, 회색 보조 정보, 주황 행동 신호로 통일했다.
- 이미지 품질: 실제 저장 릴스 커버와 공개 Instagram 대표 이미지를 사용한다. 상세는 공개 릴스의 실제 영상 URL이 있을 때 모바일 인라인 재생하며, 없을 때만 실제 대표 화면과 원본 릴스 행동을 보여준다.
- 카피와 콘텐츠: 사용자 화면과 Instagram 답장에서 `지도`, `핀`, `여러 장소 추출`을 전면에 내세우는 문구를 제거했다. 핵심 약속을 `맛집 릴스를 가까운 역별로 자동 정리`로 통일했다.
- 접근성과 행동: 모든 터치 대상은 최소 44px이다. 검색, 최근 본 역, 역 선택, 카테고리 필터, 영상 상세, 원본 릴스, 길찾기, 공유, 장소 정보, 데이터 관리가 실제 행동과 연결된다.
- 개인정보: 개인 토큰은 계속 URL fragment에만 남는다. 상세의 공유 버튼은 개인 보관함 URL이 아니라 공개 원본 릴스 URL만 공유한다.

## Full-view comparison evidence

- `home-comparison.png`: Canopi의 묶음 구조를 역별 보관함에 적용하고, 사용자가 가장 먼저 `어느 역에서 찾으세요?`를 읽도록 바꿨다.
- `station-comparison.png`: Crème의 실제 음식 이미지 중심 2열 카드 구조를 역삼역 영상 3개에 적용했다. MATPIN에는 실제 과업에 필요한 카테고리 필터와 도보 정보만 추가했다.
- `detail-comparison.png`: Crème의 큰 영상, 제목 오버레이, 영상 직후 핵심 행동 구조를 유지하고 `원본 릴스·길찾기·공유·장소 정보`로 치환했다.

## Focused region comparison evidence

- 상세 비교에서 영상 상단 뒤로가기·저장 상태, 영상 아래 4개 행동, 상세 정보의 시작 위치가 같은 화면에서 충분히 크게 읽힌다.
- 역 목록 비교에서 카드 모서리, 실제 이미지 crop, 제목과 역 정보, 2열 간격이 충분히 보여 별도 확대 crop은 만들지 않았다.

## Comparison history

1. 개념 통일
   - [P1] 이전 구현은 역별 첫 화면만 있었고 카드가 곧바로 Instagram으로 이동해 `역 선택 → 영상 탐색 → 상세 → 길찾기` 전체 흐름이 없었다.
   - fix: `/matpin/station/[station]`과 `/matpin/reel/[reel]`을 추가하고 개인 토큰과 선택 역을 모든 내부 링크에 유지했다.
   - post-fix evidence: `matpin-dark-flow-station-2026-08-02.png`, `matpin-dark-flow-detail-final-2026-08-02.png`.
2. 상세 영상과 제목 충돌
   - [P2] 실제 모바일 영상 제어 막대가 하단 제목과 같은 위치에 나타나 정보가 겹쳤다.
   - fix: Crème의 제목 오버레이를 유지하면서 제목을 영상 하단에서 72px 위로 올려 기본 제어 막대와 분리했다.
   - post-fix evidence: `detail-comparison.png`.
3. 작은 보조 글자
   - [P2] 정적 UI 검사에서 일부 배지·거리·상세 라벨이 10~11px로 검출됐다.
   - fix: 사용자가 읽는 메타데이터를 모두 12px 이상으로 올리고 검색 입력의 불필요한 outline 제거 선언을 삭제했다.
   - post-fix evidence: `audit_ui.py`를 변경된 홈·보관함·역·상세 화면과 CSS에 각각 실행해 finding 0건을 확인했다.
4. 서비스 언어
   - [P2] 랜딩·확인·삭제·Instagram 답장에 이전 `내 지도` 언어가 남아 새 역 중심 개념과 충돌했다.
   - fix: 사용자 화면과 답장을 `역별 릴스 보관함`으로 통일하고 지도는 길찾기 버튼의 실제 목적지로만 남겼다.
   - post-fix evidence: Matpin 사용자 화면 소스에서 `지도|여러 장소` 검색 결과 0건.

## Primary interactions tested

- 개인 보관함: 실제 릴스 API 응답, `최근 본 역`, 역·가게 검색, 역삼역 이동
- 역 화면: `전체 → 일식 → 전체` 필터, 3개 → 1개 → 3개 영상 전환
- 상세: 원본 릴스 URL, 외부 길찾기 URL, Web Share 호출, 장소 정보로 스크롤
- 검색 전용 경로: 입력 자동 포커스, `치솟` 검색 시 해당 영상만 표시
- 직접 URL: 홈·보관함·역·상세가 모두 390px 문서 너비 안에서 렌더
- 콘솔: 새 브라우저 탭에서 보관함 → 역삼역 → 상세 순서로 이동한 뒤 오류·경고 0개
- 정적 검사: TypeScript, ESLint, `audit_ui.py`, 프로젝트 context check 통과
- 단위 테스트: Matpin 36개 통과. 같은 릴스의 성수역·뚝섬역 분리와 토큰 fragment 보존을 포함한다.

## Follow-up polish

- [P3] iOS와 Android의 실제 OS 공유 시트 완료 화면은 배포 뒤 실기기에서 한 번씩 확인할 수 있다. 현재 브라우저에서는 원본 릴스만 Web Share API에 전달되는 계약까지 확인했다.
- [P3] 원본 릴스 표지 자체에 큰 자막이 있는 경우, 사용 가능한 실제 프레임 중 글자가 적은 프레임을 고르는 후처리를 추가할 수 있다.

final result: passed

---

# MATPIN 역별 릴스 첫 화면 Design QA

## 비교 대상

- source visual truth 1: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/canopi-03-result-list.jpg`
- source visual truth 2: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/research/mobbin/assets/matpin-click-flow-references-2026-08-02/creme-03-saved-grid.jpg`
- implementation screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-station-reels-first-screen-final-2026-08-02.png`
- first-pass screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-station-reels-first-screen-2026-08-02.png`
- full-view comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-station-home-qa/full-comparison.png`
- focused card comparison: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/design/assets/matpin-station-home-qa/card-focus-comparison.png`
- route: `http://127.0.0.1:3107/matpin/saved?preview=station-reels`
- state: 모바일 미리보기, 역삼역 1개, 저장한 Instagram 릴스 3개, 검색어 없음
- source pixels: Canopi `299 × 678`, Crème `299 × 678`
- implementation pixels: `390 × 844`
- CSS viewport: `390 × 844`, 브라우저 보고 device pixel ratio `2`
- density normalization: 두 레퍼런스는 높이 `844px`로 맞췄고, 구현 캡처는 브라우저가 CSS 크기 `390 × 844`로 정규화해 반환한 이미지를 그대로 사용했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트와 타이포그래피: Crème의 굵고 짧은 제목, 작은 보조 정보 위계를 한국어에 맞춰 유지했다. 첫 제목은 32px/1.08, 역 제목은 25px/1.18이며 장소명과 역 정보는 카드 아래에서 한 줄 말줄임 처리한다.
- 간격과 레이아웃: Canopi의 `묶음 제목 → 묶음 안 항목` 구조를 `역 제목 → 가로 릴스 레일`로 옮겼다. 첫 화면에서 검색, 역 칩, 역삼역 영상 3개가 이어지고 페이지 전체 가로 오버플로는 없다.
- 색과 토큰: Crème의 검정 배경과 밝은 콘텐츠, 절제된 회색 보조색을 유지하면서 MATPIN의 주황색을 눈썹 문구와 위치 아이콘에만 썼다.
- 이미지 품질: 산장장작구이는 저장된 실제 릴스 커버를 사용한다. 돝고기506과 치솟 역삼본점은 공개 Instagram 릴스에서 실제 대표 이미지를 불러온다. 가짜 음식 이미지나 빈 플레이스홀더를 사용하지 않았다.
- 카피와 콘텐츠: 핵심 문구를 `역마다 모아봤어요.`로 고정하고 `1개 역 · 저장한 영상 3개`, `가까운 역`, `영상 3개`로 정보 구조를 바로 설명한다. 내 위치를 쓰지 않는다는 개인정보 안내도 유지한다.
- 접근성과 행동: 검색 입력, 검색어 지우기, 역 바로가기, 릴스 원본 링크, 데이터 관리 링크에 접근 가능한 이름이 있다. 390px 화면에서 문서 너비는 390px이며 릴스 레일만 의도적으로 가로 스크롤된다.

## Full-view comparison evidence

- `full-comparison.png`에서 Canopi의 컬렉션 단위 반복, Crème의 검정 배경 음식 카드, MATPIN의 역별 릴스 구조를 한 이미지에서 비교했다.
- 구현은 레퍼런스를 복제하지 않고 역할을 나눠 적용했다. Canopi에서는 묶음 구조를, Crème에서는 영상 중심의 어두운 카드 언어를 가져왔다.

## Focused region comparison evidence

- `card-focus-comparison.png`에서 Crème 첫 음식 카드와 MATPIN 첫 릴스 카드를 확대 비교했다.
- 두 카드 모두 큰 실제 음식 사진, 둥근 모서리, 강한 제목 대비를 사용한다. MATPIN은 원본 릴스임을 알려야 하므로 `Reel` 배지와 재생 버튼, 역 정보를 추가한 것이 의도적 차이다.

## Comparison history

1. 첫 비교
   - [P1] 임시 데이터가 릴스 1개를 한강진역·강남구청역·홍대입구역에 반복해, 사용자가 잠근 `한 역에서 여러 영상을 본다`는 개념보다 `한 영상의 여러 장소`가 더 강하게 보였다.
   - fix: 실제 보유한 서로 다른 Instagram 릴스 3개(산장장작구이·돝고기506·치솟 역삼본점)를 역삼역 하나의 가로 레일로 묶었다.
   - post-fix evidence: `matpin-station-reels-first-screen-final-2026-08-02.png`과 `full-comparison.png`에서 `역삼역 · 영상 3개`가 한 묶음으로 보인다.
2. 성능 경고 수정
   - [P2] 첫 릴스 커버가 위쪽 핵심 이미지인데도 Next Image 우선 로딩이 꺼져 LCP 경고가 남았다.
   - fix: 첫 역의 첫 릴스 이미지만 `priority`를 켜고 나머지는 지연 로딩을 유지했다.
   - post-fix evidence: 수정 뒤 새 요청에서 화면과 API가 정상 응답했고 서버 오류가 없었다.
3. 최종 비교
   - P0/P1/P2 없음.
   - 검색 `치솟`은 치솟 카드만 남기고, 지우기 뒤 영상 3개로 복귀한다.
   - 페이지 가로 오버플로 없음. 릴스 레일은 `clientWidth 390`, `scrollWidth 522`로 의도한 가로 넘김이 동작한다.

## Primary interactions tested

- `치솟` 검색 → 치솟 역삼본점 카드만 표시
- 검색어 지우기 → 역삼역 영상 3개 복귀
- 역삼역 칩 선택 → 역삼역 섹션으로 이동
- 각 릴스 카드의 실제 Instagram 원본 URL과 접근성 이름 확인
- 내 데이터 관리 링크에 현재 개인 토큰이 유지되는지 확인
- 390px 모바일 화면의 문서 가로 오버플로 확인
- 브라우저 콘솔 오류 확인: 새 오류 0개. 수정 전 LCP 경고 1개는 첫 이미지 `priority` 적용으로 해결했다.

## Follow-up polish

- [P3] 저장 영상이 더 쌓이면 자주 보는 역 순서와 최근 저장 순서 중 어떤 정렬이 재방문에 더 좋은지 실제 사용 데이터로 정할 수 있다.

final result: passed

---

# MATPICK 탐색 화면 Design QA

## 비교 대상

- source visual truth: `/var/folders/s4/gjxlysx94hx4byf5snyfrrm80000gn/T/codex-clipboard-99f6d1f0-1cc5-4014-bcc5-7b01dbdc4db9.png`
- implementation screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/product-design-audit-2026-07-28/20-matpick-thumbnail-gradient-final.jpg`
- side-by-side evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/product-design-audit-2026-07-28/22-matpick-thumbnail-full-comparison.png`
- focused thumbnail evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/product-design-audit-2026-07-28/21-matpick-thumbnail-focus-comparison.png`
- route: `http://127.0.0.1:3001/matpick`
- state: 모바일 390 × 844, 지역 전체, 최신순, 저장 0, 검색어 없음, 상세 닫힘
- source pixels: 853 × 1844
- implementation pixels: 390 × 844
- CSS viewport: 390 × 844
- density normalization: source와 구현을 각각 426 × 920으로 맞춘 뒤 가로로 결합했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 타이포그래피: 굵은 MATPICK 워드마크, 16px 검색 입력, 18px 지역 제목, 14px 지역 칩, 11–14px 카드 텍스트로 탐색 위계를 유지한다.
- 간격과 레이아웃: 검색은 헤더 아이콘으로 축약하고 필요할 때만 입력창이 열린다. 정렬은 지역 칩보다 앞에 두고 1px 구분선으로 기능군을 나눴다. 별도 지역 제목과 결과 요약 행은 삭제했으며 결과는 간격 2px의 3열 9:16 그리드다.
- 색과 토큰: 흰 배경, `#202124` 본문, `#246bfd` 지역 선택, 회색 검색 배경과 구분선을 기존 Google Maps 계열 토큰으로 유지했다. 썸네일 하단은 고정 검정 면 대신 투명 → 검정 4단계 그라데이션을 적용했다.
- 이미지 품질: 현재 검증된 릴스·쇼츠의 자동 생성 영상 프레임과 같은 음식점을 다룬 공개 영상 프레임만 사용했다. 영상 자체에 포함된 자막은 실제 원본 증거이므로 지우거나 가짜 음식 사진으로 대체하지 않았다.
- 카피와 콘텐츠: 시안의 가상 12개 카드 대신 현재 검증된 5개 장소만 노출한다. 카드 수가 적어 마지막 행이 비는 것은 데이터 진실성을 지키기 위한 의도적 차이다.
- 접근성과 상태: 검색 열기·닫기, 검색어 지우기, 지역 전환, 정렬, 저장, 상세 열기·닫기가 실제로 동작한다. 아이콘으로 축약된 검색과 저장도 명시적인 접근성 이름과 상태를 유지한다.

## Full-view comparison evidence

- `22-matpick-thumbnail-full-comparison.png`에서 흰색 헤더, 검정 워드마크, 지역 칩, 3열 9:16 그리드, 카드 하단 장소·거리·저장 정보의 구조를 함께 확인했다.
- 검색과 저장은 헤더 아이콘으로, 정렬과 지역은 한 줄 도구 모음으로 압축해 시안보다 그리드가 더 빨리 시작된다. 이는 이번 6개 브라우저 주석을 반영한 의도적 차이다.

## Focused region comparison evidence

- `21-matpick-thumbnail-focus-comparison.png`에서 첫 카드의 그라데이션 시작점, 장소명 중앙 정렬, 플랫폼·거리와 저장 아이콘의 하단 기준선을 확대 비교했다.
- 구현 카드 비율은 CSS `aspect-ratio: 9 / 16`, 그리드는 `repeat(3, minmax(0, 1fr))`로 고정했다.

## Comparison history

1. 첫 비교
   - [P1] 선택한 3열 시안과 달리 구현이 대표 영상 1개와 세로 목록을 중복 노출해 한 화면에서 비교할 수 있는 후보가 적었다.
   - fix: 대표 영상과 목록을 하나의 3열 9:16 그리드로 통합했다.
   - post-fix evidence: `08-matpick-dense-grid-final.png`.
2. 두 번째 비교
   - [P2] 강남역이 기본 선택되어 검증 데이터가 2개만 보였고, 3열 구조의 빈칸이 첫 화면에서 크게 드러났다.
   - fix: 첫 진입은 `지역 전체`로 바꾸고 강남역·역삼역은 명시적 지역 필터로 유지했다.
   - post-fix evidence: 첫 화면에서 실제 장소 5개가 노출된다.
3. 세 번째 비교
   - [P2] 돝고기506 카드가 커버 없이 회색으로 노출됐다.
   - fix: 릴스 커버가 없을 때 같은 음식점을 다룬 공개 YouTube 원본 썸네일을 사용하도록 이미지 대체 규칙을 보완했다.
   - post-fix evidence: `09-matpick-reference-comparison.png`의 구현 화면에 빈 이미지 카드가 없다.
4. 썸네일 재비교
   - [P1] 실제 YouTube 대표 썸네일 안의 큰 제목과 맛픽의 장소명이 같은 영역에 겹쳐 표기가 중복됐다.
   - fix: YouTube의 자동 생성 중간 프레임으로 교체하고, 장소명·출처·거리·저장을 불투명한 54px 정보 선반에 한 줄로 고정했다. 영상 길이 배지도 제거했다.
   - post-fix evidence: `15-matpick-thumbnail-fix-final.png`; 장소명은 한 줄 말줄임, 거리와 저장은 고정 위치로 정렬된다.
5. 브라우저 주석 반영
   - [P1] 검색창, 지역 제목, 결과 요약, 출처 안내가 첫 화면의 수직 공간을 차지해 숏폼 그리드 진입이 늦었다.
   - fix: 검색을 헤더 아이콘으로 축약하고, 지역 제목·결과 요약·하단 출처 문구를 삭제했다.
   - [P2] 정렬이 지역 칩과 분리되어 탐색 도구를 한 번에 훑기 어려웠다.
   - fix: 정렬을 지역 칩 왼쪽으로 이동하고 1px 구분선을 추가했다. 저장은 북마크 아이콘과 숫자만 남겼다.
   - post-fix evidence: `17-matpick-annotation-cleanup-final.png`; 접근성 스냅샷에서도 삭제 대상 문구가 더 이상 노출되지 않는다.
6. 최종 비교
   - P0/P1/P2 없음.
   - 브라우저 콘솔 오류 없음.
   - 가로 오버플로 없음.
7. 썸네일 구성 재비교
   - [P1] 구현은 카드 하단 54px를 불투명 검정 면으로 가려 이미지와 정보가 두 덩어리처럼 보였고, 레퍼런스의 사진 위 정보 구조와 달랐다.
   - fix: 카드 하단 48%에 투명 → 검정 그라데이션을 적용하고, 장소명을 중앙 정렬해 메타데이터 위로 올렸다. 플랫폼·거리와 저장 아이콘은 같은 하단 기준선에 정렬했다.
   - [P2] 긴 지점명 때문에 두 번째 카드명이 잘리고 저장 아이콘과 경쟁했다.
   - fix: 접근성 이름과 상세 정보는 공식 명칭을 유지하면서 카드 표기만 `전설의우대갈비`로 축약했다.
   - post-fix evidence: `21-matpick-thumbnail-focus-comparison.png`; 검정 면이 사라지고 이미지가 카드 끝까지 이어지며 텍스트와 아이콘은 그라데이션 위에서 읽힌다.

## Primary interactions tested

- 헤더 검색 아이콘 열기·닫기
- 검색어 `역삼` 입력 시 5곳 → 3곳 필터링, 닫을 때 검색어 초기화
- 지역 전체 → 강남역 전환 시 2곳 필터링
- 최신순 → 조회수순 변경
- 맛집 저장 후 헤더 수량 0 → 1 반영, 다시 저장 취소
- 카드 선택 후 9:16 원본 영상 상세 열기와 닫기

## Follow-up polish

- [P3] 실제 숏폼이 9개 이상 쌓이면 첫 화면의 밀도가 시안과 더 가까워진다.
- [P3] 영상 자체 자막과 카드 장소명이 겹치는 커버는 수집 단계에서 여러 프레임을 OCR 비교해 글자가 적은 실제 프레임을 저장할 수 있다.

---

# MATPICK 전용 검색 화면 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Downloads/IMG_4965.PNG`
- implementation screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/product-design-audit-2026-07-28/23-matpick-search-final.png`
- result screenshot: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/product-design-audit-2026-07-28/25-matpick-search-results.png`
- side-by-side evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/artifacts/product-design-audit-2026-07-28/24-matpick-search-reference-comparison.png`
- route: `http://127.0.0.1:3001/matpick/search`
- state: 모바일 390 × 844, 검색어 없음, 입력창 자동 포커스, 최근 검색 1개
- source pixels: 1125 × 2436
- implementation pixels: 390 × 844
- CSS viewport: 390 × 844
- density normalization: source에서 OS 상태 표시줄과 키보드를 제외한 앱 영역을 잘라 390px 너비로 축소하고, 구현 화면과 12px 구분선을 두어 한 이미지로 결합했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 타이포그래피: 레퍼런스의 입력 우선 구조, 굵은 섹션 제목, 보조 최근 검색 텍스트 위계를 기존 MATPICK의 한국어 산세리프와 1.5 이상 행간으로 옮겼다.
- 간격과 레이아웃: 뒤로가기 → 검색 입력 → 닫기의 상단 3열 구조, 바로가기 4개, 최근 검색 목록 순서를 유지했다. 키보드는 브라우저가 아니라 모바일 OS가 제공하는 영역이므로 코드로 복제하지 않았다.
- 색과 토큰: 레퍼런스의 검정 테마는 가져오지 않고, 사용자가 잠근 MATPICK의 Google Maps 계열 흰 배경·`#202124` 본문·`#246bfd` 강조색을 유지했다. 다른 앱에서는 행동과 정보 구조만 참조한다는 기존 설계 규칙에 따른 의도적 차이다.
- 이미지 품질: 검색 결과는 기존 공개 릴스·쇼츠의 실제 썸네일을 사용한다. 썸네일이 없는 Instagram 릴스는 같은 장소를 다룬 기존 YouTube 프레임으로 대체해 빈 카드를 없앴다.
- 카피와 콘텐츠: 당근의 스토리·알바·부동산·중고차와 당근 소식은 MATPICK과 무관해 가져오지 않았다. 강남역·역삼역·한식·일식의 실제 검색 바로가기와 실제 장소 결과로 치환했다.
- 접근성과 상태: 검색 아이콘은 `/matpick/search` 링크이며, 새 화면에서 검색 입력이 자동 포커스된다. 입력·지우기·최근 검색 저장·개별 삭제·전체 삭제·닫기·원본 영상 이동이 실제로 동작한다.

## Full-view comparison evidence

- `24-matpick-search-reference-comparison.png`에서 상단 검색 헤더, 바로가기, 최근 검색의 세 단계 구조를 같은 화면에서 비교했다.
- 테마와 서비스별 콘텐츠 차이는 의도적이며, 검색 과업의 정보 구조와 터치 대상 밀도는 레퍼런스를 따른다.

## Focused region comparison evidence

- 상단 검색 헤더와 최근 검색이 모두 한 화면에 충분히 크게 보이므로 별도 확대 비교는 필요하지 않았다.
- 결과 상태는 `25-matpick-search-results.png`에서 `역삼역` 검색 시 3개 실제 장소, 썸네일, 지역·카테고리·거리, 원본 영상 행동을 별도로 확인했다.

## Comparison history

1. 첫 구현
   - [P1] 돝고기506 검색 결과의 최신 Instagram 릴스에 썸네일이 없어 회색 빈 이미지로 표시됐다.
   - fix: 동일 장소의 기존 YouTube 영상 프레임을 검색 결과 썸네일 대체 자산으로 사용했다.
   - post-fix evidence: `25-matpick-search-results.png`에서 세 장소 모두 실제 음식 이미지가 표시된다.
2. 최종 비교
   - P0/P1/P2 없음.
   - 자동 포커스, `역삼역` 3곳 필터링, Enter 최근 검색 저장, 검색어 지우기, 빠른 검색, 최근 검색 재실행, 닫기 복귀를 확인했다.
   - 전용 E2E에서 페이지 런타임 오류가 없음을 확인했다.

## Primary interactions tested

- `/matpick` 헤더 검색 아이콘 → `/matpick/search`
- 입력창 자동 포커스
- `역삼역` 입력 → 실제 3곳 결과
- Enter → 최근 검색 저장
- 검색어 지우기 → 빠른 검색·최근 검색 복귀
- 빠른 검색·최근 검색 재실행
- 닫기 → `/matpick`

## Follow-up polish

- [P3] 모바일 실기기에서 진입 직후 소프트 키보드가 올라오는 상태는 iOS Safari와 Android Chrome에서 한 번씩 확인할 수 있다.

final result: passed

---

# BF.D Meta 광고 보고서 PDF → HTML Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/reports/meta-ads-creative-performance-2026-08-01.pdf`
- implementation: `http://127.0.0.1:4321/docs/reports/meta-ads-creative-performance-2026-08-01.html`
- implementation screenshots: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/tmp/pdfs/meta-ads-report-reference/html-page-1.png` ~ `html-page-5.png`
- side-by-side evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/tmp/pdfs/meta-ads-report-reference/compare-1.png` ~ `compare-5.png`
- state: 광고 데이터 최종 스냅샷, 랜딩 화면 이미지 제외, 광고 소재 4장 표시
- source pixels: 페이지별 `1190 × 1684`
- implementation pixels: 페이지별 `960 × 1357`
- CSS viewport: 기본 in-app browser `1012 × 1040`
- density normalization: PDF 페이지를 `960 × 1357`로 정규화한 뒤 같은 크기의 HTML 페이지 캡처와 가로로 결합했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트·타이포그래피: PDF의 굵은 산세리프 제목, 2px 섹션 구분선, 작은 회색 보조 문구와 숫자 중심 계층을 HTML에 유지했다.
- 간격·레이아웃: A4 비율의 5개 페이지, 표지 여백, 10개 핵심 지표, 예산 카드, 비교표, 광고 카드, 시간대 표, 결론 페이지의 순서와 밀도를 맞췄다.
- 색상·토큰: 흰 종이, 검정 본문, 연회색 표·카드, 상태 배지와 링크에만 제한적으로 색을 쓰는 PDF 팔레트를 유지했다.
- 이미지 품질: PDF에 사용된 실제 Feed 4:5 광고 소재 4장을 원본 경로로 불러오며 모두 정상 로드된다. 랜딩 화면 이미지는 0장이다.
- 카피·콘텐츠: PDF의 제목, 지표, 판정, 설명, 출처를 그대로 유지했다. 광고 소재와 텍스트 링크는 정확한 네 예약 URL로 연결된다.
- 접근성과 반응형: 5개 페이지가 일반 문서 스크롤로 이어지고, 모바일에서는 종이 그림자와 고정 페이지 높이를 제거한다. 넓은 표는 자체 가로 스크롤 영역과 접근 가능한 이름을 가진다.

## Full-view comparison evidence

- `compare-1.png`부터 `compare-5.png`까지 PDF를 왼쪽, HTML을 오른쪽에 같은 크기로 배치해 표지, 지표, 표, 광고 카드, 차트, 결론 페이지를 모두 비교했다.
- HTML은 웹 읽기성과 클릭 행동을 위해 링크의 파란색과 화면 페이지 사이 24px 간격만 유지한 의도적 차이가 있다.

## Focused region comparison evidence

- 광고 카드의 이미지 비율, 4×2 지표 격자, 제목·상태 배지·설명·예약 링크가 전체 페이지 비교에서 충분히 크게 읽혀 별도 확대 비교는 필요하지 않았다.
- 시간대 막대와 비교표도 같은 페이지에서 행 높이와 숫자 정렬을 확인했다.

## Comparison history

1. 첫 비교
   - [P2] HTML 표지 콘텐츠가 PDF보다 약 200px 아래에 배치됐다.
   - [P2] `scroll-behavior: smooth` 때문에 스크롤 직후 위치가 바로 바뀌지 않아 스크롤이 막힌 것처럼 느껴졌다.
   - [P2] 4쪽의 한입코치 카드와 시간대별 노출 제목 사이 간격이 PDF보다 좁았다.
2. 수정
   - 표지 상단 여백을 PDF 기준으로 고정하고 세로 중앙 정렬을 제거했다.
   - 부드러운 스크롤을 제거하고 문서 루트에 일반 세로 스크롤을 명시했다.
   - 요약 카드와 섹션 간격, 한입코치 카드 뒤 간격을 PDF에 맞게 늘렸다.
3. 최종 비교
   - post-fix evidence: `compare-1.png`, `compare-2.png`, `compare-4.png`, `compare-5.png`.
   - 스크롤 위치가 `0 → 900px`로 즉시 변경되고 다시 상단 `0`으로 복귀했다.
   - 콘솔 오류 0개, 광고 이미지 4장 정상 로드, 랜딩 이미지 0장, 예약 링크 8개를 확인했다.

## Primary interactions tested

- 세로 스크롤과 상단 복귀
- 광고 소재와 텍스트 링크의 네 예약 URL 계약
- 넓은 비교표의 독립 가로 스크롤 영역
- 광고 이미지 로드 상태
- 브라우저 콘솔 오류 확인

## Follow-up polish

- [P3] 실제 인쇄 시 운영체제의 인쇄 여백 설정에 따라 1~2px 선 위치가 달라질 수 있다.

final result: passed

---

# 한입코치 · Today · 상황 카드 모바일 퍼스트 재설계 QA

## 비교 대상

- 공통 viewport: `390 × 844`
- 한입코치 구현: `artifacts/design-audit-2026-07-29/05-onebite-mobile-final.png`
- Today 구현: `artifacts/design-audit-2026-07-29/06-today-mobile-final.png`
- 지난 타로 source: `artifacts/design-audit-2026-07-29/04-tarot-reference-904107b-mobile.png`
- 상황 카드 구현: `artifacts/design-audit-2026-07-29/07-story-mobile-final.png`
- 타로 source와 상황 카드 비교: `artifacts/design-audit-2026-07-29/08-tarot-story-comparison.png`
- source commit: `904107b`

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 한입코치 첫 화면은 사진 선택 하나만 남겼다. 사진을 고르기 전에는 분석 버튼과 지난 실행 기록을 보여주지 않는다.
- Today 첫 화면은 `아이디어가 있다 / 없다` 선택만 남겼다. 아이디어 검토와 제작 신청을 별도 단계로 나눠 한 화면에 두 과업이 겹치지 않는다.
- 상황 카드는 지난 타로 구현의 검정 무대, 중앙 목표 카드, 실제 부채꼴 덱을 다시 사용했다. 카드 뽑기와 상황 목록은 동시에 노출하지 않고 명시적인 전환 버튼으로 분리했다.
- 세 앱의 여러 줄 제목은 `line-height: 1.25`, 본문은 `line-height: 1.75` 공통 토큰을 사용한다.
- 주요 조작은 최소 `48px` 터치 영역을 유지한다. 카드 이동은 220ms이며, reduced motion에서는 위치 이동 대신 opacity 전환만 남긴다.

## Primary interactions tested

- 한입코치 첫 화면: 파일 입력 1개, 제출 버튼 0개 확인
- Today: `네, 있어요` 선택 후 아이디어 입력 화면 전환과 `시작으로` 복귀
- 상황 카드: `상황을 직접 고르기` 전환 후 4개 상황 목록 노출과 카드 뽑기 화면 복귀
- 세 화면 모두 브라우저 콘솔 오류 없음
- 타입 검사, 대상 ESLint, Next.js production build 성공
- 한입코치·Today 단위 테스트 9개 통과

## 의도적인 차이

- 지난 타로 화면의 가로 캐러셀과 상단 로그인 탭은 상황 대화 시작에 필요하지 않아 제외했다.
- 상황 카드는 카드 덱 자체를 첫 행동으로 유지하되, 원하는 장면을 직접 고르는 경로를 보조 행동으로 남겼다.
- 로그인과 계정 연결은 결과를 보기 전에는 요구하지 않는다.

final result: passed

---

# Today 실제 1일 전달 Design QA

## 비교 대상

- source visual truth: `docs/research/mobbin/assets/today-real-delivery-2026-07-29/lensa-decision-strip.jpg`
- 보조 source: `docs/research/mobbin/assets/today-real-delivery-2026-07-29/fiverr-decision-strip.jpg`
- implementation queue: `docs/research/mobbin/assets/today-real-delivery-2026-07-29/04-queued-final.jpg`
- implementation result: `docs/research/mobbin/assets/today-real-delivery-2026-07-29/05-ready-final.jpg`
- combined comparison: `docs/research/mobbin/assets/today-real-delivery-2026-07-29/06-reference-prototype-comparison.jpg`
- route: `http://127.0.0.1:3001/today`
- state: 모바일 390 × 844, 서버 큐 접수 완료와 결과 ready
- source pixels: 1148 × 618
- implementation pixels: 390 × 844
- CSS viewport: 390 × 844
- deviceScaleFactor: 1
- density normalization: 원본 결정 스트립과 구현 화면의 높이를 760px로 맞춘 뒤 가로로 결합했다. 서로 다른 제품의 시각 스타일이 아니라 상태 위계와 정보 구조를 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트·타이포그래피: Today의 기존 한국어 산세리프와 큰 결과 제목을 유지했다. Lensa의 짧은 동사형 상태 제목과 Fiverr의 예상 완료 시각 위계만 전이했다.
- 간격·레이아웃: 첫 화면에 제작 번호, 제목, 예상 시각, 3단계 진행, 수신 주소, 보조 행동이 모두 보인다. 390px에서 가로 오버플로와 잘린 영구 조작부가 없다.
- 색과 토큰: 기존 Today의 크림 배경, 파랑 활성 상태, 초록 완료 상태를 유지했다. 다른 앱의 노랑·초록 브랜드 색은 섞지 않았다.
- 이미지 품질: 큐 화면에는 이미지가 필요하지 않아 상태 정보만 사용했다. 완료 화면의 광고 이미지는 기존 Today 결과 생성기의 자산을 그대로 유지했으며, 이번 작업에서 새 대체 이미지를 만들지 않았다.
- 카피와 콘텐츠: `로컬 데모`, `결과 잠금`, `공개 대기`를 삭제했다. `신청 정보 저장 → 광고·랜딩 제작 → 전용 링크 이메일 전달`로 실제 시스템 상태를 표현한다.
- 접근성: 프로그램으로 초점을 옮기는 `h1`의 불필요한 시각 테두리를 제거했지만 스크린리더 초점 이동은 유지했다. 버튼·링크·상태 문구는 접근 가능한 이름을 가진다.

## Full-view comparison evidence

- `06-reference-prototype-comparison.jpg`에서 Lensa의 작업 진행/완료 흐름과 Today의 접수/제작/전달 흐름을 한 화면에서 비교했다.
- 원형 퍼센트는 실제 작업 퍼센트를 제공하지 못하므로 복제하지 않았다. 대신 서버에서 확인 가능한 세 상태만 표시한 의도적 차이다.
- Fiverr의 계약·채팅·결제 영역은 제외하고 제작 번호, 예상 시각, 타임라인만 채택했다.

## Focused region comparison evidence

- 큐 상태 카드와 예상 시간은 390 × 844 화면에서 충분히 읽혀 별도 확대가 필요하지 않았다.
- 완료 화면은 `05-ready-final.jpg`에서 광고, 랜딩, 측정 기준 세 결과와 전체 화면 링크가 같은 세로 흐름 안에서 잘리지 않는 것을 확인했다.

## Comparison history

1. 첫 비교
   - [P2] 완료 화면 제목에 프로그램 포커스용 테두리가 보였다.
   - [P3] 측정 기준의 `셀 행동` 문구가 의미를 바로 전달하지 못했다.
   - fix: `tabIndex=-1` 제목의 시각 outline을 제거하고 `성공 행동`으로 수정했다.
2. 재비교
   - post-fix evidence: `05-ready-final.jpg`.
   - 제목 테두리가 사라졌고 세 결과 카드의 위계와 모바일 폭이 안정적이다.
   - P0/P1/P2 잔여 이슈 없음.

## Primary interactions tested

- 아이디어가 없는 경로의 세 객관식 질문
- 실제 매출 원본과 아이디어 초안 확인
- 이메일 입력과 제작 신청
- 서버 큐 접수 화면
- 서버 상태 조회 후 ready 전환
- 전용 토큰이 포함된 랜딩 미리보기 링크
- 가짜문 행동 기록
- 설정이 없을 때 거짓 성공 대신 `서버 작업 큐와 이메일 설정이 아직 연결되지 않았어요` 오류 표시

## Runtime and data verification

- Next.js production build 성공.
- Today E2E 2/2 통과, 이후 최종 시각 캡처 E2E 1/1 통과.
- Today 단위 테스트 6/6 통과.
- 타입 검사와 대상 ESLint 통과.
- 현재 브라우저 로그에는 새 런타임 오류가 없다. 편집 중 발생한 과거 HMR import 경고는 최종 production build에서 재현되지 않았다.
- 원격 Supabase는 `pgmq` 사용 가능 버전이지만 `today_jobs`와 큐 migration은 아직 적용되지 않았다.

## Follow-up polish

- [P3] 실제 작업 퍼센트를 계산할 수 있게 되면 Lensa처럼 진행률 원형을 추가할 수 있다. 지금은 거짓 퍼센트를 보여주지 않는다.

final result: passed

---

# 네 앱 Fake Door 예약 Design QA

## Scope

- 구현 경로
  - `/reserve/matpick`
  - `/reserve/onebite`
  - `/reserve/today`
  - `/reserve/story-cards`
- 전환 흐름: 광고·앱 화면 → 체험 시기 선택 → Google 계정 확인 → 예약 확정
- 테스트 화면
  - 데스크톱: CSS viewport `1280 × 800`, screenshot `1280 × 800`, density `1`
  - 모바일: CSS viewport `390 × 844`, 가로 overflow 없음

## Source and implementation evidence

- MATPICK
  - source: `public/images/experiment-gallery/matpick.jpg`
  - implementation: `artifacts/product-design/reservations/matpick-implementation-1280x800.png`
  - comparison: `artifacts/product-design/reservations/matpick-source-vs-implementation.png`
- 한입코치
  - source: `public/images/experiment-gallery/onebite-redesign.jpg`
  - implementation: `artifacts/product-design/reservations/onebite-implementation-1280x800.png`
  - comparison: `artifacts/product-design/reservations/onebite-source-vs-implementation.png`
- Today
  - source: `public/images/experiment-gallery/today-unified.svg`
  - implementation: `artifacts/product-design/reservations/today-implementation-1280x800.png`
  - comparison: `artifacts/product-design/reservations/today-source-vs-implementation.png`
- 캐릭터챗
  - source: `public/images/experiment-gallery/story-cards-redesign.jpg`
  - implementation: `artifacts/product-design/reservations/story-cards-implementation-1280x800.png`
  - comparison: `artifacts/product-design/reservations/story-cards-source-vs-implementation.png`

## Full-view comparison

- 네 비교 이미지는 모두 원본을 왼쪽, 구현을 오른쪽에 같은 `1280 × 800` 상태로 배치했다.
- 폰트·타이포: 앱별 기존 제목 위계와 한국어 서체를 유지했고, 예약 설명은 읽기 쉬운 크기와 줄 길이로 제한했다.
- 간격·레이아웃: 기존 앱 화면의 여백과 라운드를 이어받고, 예약 선택 카드에는 동일한 수직 리듬을 적용했다.
- 색상·토큰: MATPICK의 파랑·흰색, 한입코치의 연두색, Today의 파랑·크림색, 캐릭터챗의 검정·금색을 그대로 연결했다.
- 이미지 품질: 네 앱의 실제 갤러리 자산을 사용했고, 늘림 없이 슬롯에 맞춰 crop했다.
- 카피·콘텐츠: 결제나 확정 일정을 약속하지 않고 `초기 체험 예약`과 `일정 확정 시 안내`만 명시했다.
- 예약 카드와 텍스트가 전체 화면 비교에서 충분히 읽혀 별도 확대 비교는 필요하지 않았다.

## Comparison history

1. 첫 비교
   - 네 앱 모두 P0/P1/P2 없음.
   - 앱마다 다른 이미지·색·카피를 유지하면서 예약 단계만 공통 구조로 합쳤다.
2. 최종 비교
   - 데스크톱과 모바일에서 제목, 이미지, 세 개 일정 선택지, 로그인·확정 단계가 잘리지 않았다.
   - 모바일 네 화면 모두 `scrollWidth = 390`으로 가로 overflow가 없었다.

## Primary interactions tested

- 세 개 체험 시기 radio 선택
- Google 로그인 전·후 단계 전환
- 실제 Supabase Google 세션 인식
- 로컬 데모 로그인으로 예약 확정까지 완료
- 한입코치 `다음 주에 써보기` 선택 → 로그인 → 예약 완료 상태
- 완료 뒤 앱으로 돌아가기

## Runtime and data verification

- 브라우저 콘솔 오류 없음.
- 실제 Google 인증 세션이 있는 브라우저에서 계정 확인 완료 상태를 확인했다.
- `fake_door_reservations` 테이블의 RLS가 켜져 있고, 조회·입력·수정 정책은 모두 `auth.uid() = user_id`로 제한된다.
- 예약 저장은 `(user_id, product)` 기준 upsert라 같은 앱을 여러 번 예약해도 한 건만 유지된다.

## Follow-up polish

- [P3] 실제 Google 동의 화면은 자동으로 계정을 선택하거나 예약 데이터를 쓰지 않았다. 배포 URL을 OAuth redirect allowlist에 추가한 뒤 실계정으로 콜백 복귀를 한 번 확인하면 된다.

final result: passed

---

# BF.D Meta 광고 보고서 16:9 재구성 Design QA

## 비교 대상

- source visual truth: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/docs/reports/meta-ads-creative-performance-2026-08-01.pdf`
- design direction: 기존 PDF의 흑백 편집 스타일을 유지하되 16:9, 불필요한 선 제거, 여백과 면 중심으로 재구성
- implementation: `http://127.0.0.1:4321/docs/reports/meta-ads-creative-performance-2026-08-01.html`
- implementation screenshots: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/tmp/pdfs/meta-ads-report-reference/widescreen-slide-1.png` ~ `widescreen-slide-8.png`
- full-view evidence: `/Users/yungyulee/Project/03_BFD/3rd-lee-yungyu/tmp/pdfs/meta-ads-report-reference/widescreen-contact-sheet.png`
- CSS viewport: `852 × 1040`, 개별 슬라이드 `820 × 461.25`
- pixel dimensions: 개별 캡처 `820 × 461`
- density normalization: 브라우저에서 슬라이드 두 장씩 보이는 상태를 캡처한 뒤 각 슬라이드 영역을 `820 × 461`로 동일하게 잘라 비교했다.

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 폰트·타이포그래피: PDF의 굵은 한국어 제목과 작은 영문 키커를 유지하고, 16:9 거리에서 읽히도록 제목과 핵심 숫자 대비를 높였다.
- 간격·레이아웃: A4 5쪽을 16:9 8장으로 재배치했다. 모든 슬라이드 비율은 `1.7778`이며 내부 세로 overflow는 0px이다.
- 색상·토큰: 선 대신 `#f0efeb`, `#e4e2db` 면과 넓은 흰 여백을 사용했다. 검정 면은 결론과 그래프의 핵심 신호에만 썼다.
- 이미지 품질: 실제 광고 소재 4장을 `object-fit: contain`으로 표시해 카피와 인물이 잘리지 않는다. 랜딩 화면 이미지는 0장이다.
- 카피·콘텐츠: 원본 지표와 결론을 유지하면서 발표 슬라이드에 맞게 설명을 짧게 다듬었다. 네 광고 소재와 텍스트 링크는 정확한 예약 URL로 연결된다.
- 접근성과 반응형: 데스크톱은 16:9 슬라이드, 720px 이하는 세로 읽기 화면으로 전환된다. 표는 독립 가로 스크롤 영역과 접근 가능한 이름을 유지한다.

## Full-view comparison evidence

- `widescreen-contact-sheet.png`에서 표지, 결론, 예산·비교, 광고 소재 4개, 시간대, 예약·한계, 다음 실험의 8장 흐름을 한 번에 확인했다.
- 구분선과 테두리는 제거하고 배경 면, 카드 간격, 타이포 위계로 섹션을 구분했다.

## Focused region comparison evidence

- `widescreen-slide-4.png`와 `widescreen-slide-5.png`에서 광고 이미지 전체 노출, 4×2 지표 배열, 상태 배지, 설명과 예약 링크의 가독성을 확대 확인했다.
- `widescreen-slide-3.png`과 `widescreen-slide-6.png`에서 선 없는 표 행 면 처리와 시간대 막대 정렬을 확인했다.

## Comparison history

1. 첫 16:9 구현
   - [P1] 820px 폭에서 광고 소재 슬라이드의 내부 콘텐츠가 최대 88px 잘렸다.
   - [P2] 광고 이미지가 좁은 슬롯에 `cover`로 표시되어 이미지 카피가 잘렸다.
2. 수정
   - 4×2 지표를 4열로 유지하고 카드 패딩과 설명 길이를 줄여 모든 슬라이드 overflow를 0px로 만들었다.
   - 광고 이미지를 `contain`으로 바꿔 전체 소재가 보이도록 했다.
   - 표 구분선을 제거하고 교차 행 배경 면으로 대체했다.
3. 최종 비교
   - 8장 모두 16:9 비율 `1.7778`, overflow 0px.
   - 광고 이미지 4장 정상 로드, 랜딩 이미지 0장, 예약 링크 8개, 콘솔 오류 0개.

## Primary interactions tested

- 전체 문서 세로 스크롤과 상단 복귀
- 광고 이미지·텍스트 링크의 네 예약 URL 계약
- 넓은 표의 가로 스크롤 영역
- 광고 이미지 로딩과 전체 이미지 비율
- 브라우저 콘솔 오류 확인

## Follow-up polish

- [P3] 4K 프로젝터에서는 9~10px 보조 문구가 작게 보일 수 있으므로 실제 발표 환경에 맞춘 한 단계 큰 글자 버전을 별도로 만들 수 있다.

final result: passed

---

# BF.D 광고 소재 확대 및 첫 화면 요약 Design QA

## 비교 대상

- source visual truth: 실제 집행된 4개 광고 소재 `outputs/instagram-campaign-prep-20260801/creatives/*/feed-1080x1350.png`
- previous implementation: 광고 소재 두 장을 한 슬라이드에 나란히 배치한 8장 보고서
- implementation: `http://127.0.0.1:4321/docs/reports/meta-ads-creative-performance-2026-08-01.html`
- QA viewport: `838 × 1040`, 개별 슬라이드 `806 × 453.375`

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 보고서 2장에 실제 집행한 네 광고 이미지를 먼저 배치해, 성과 지표보다 실험 대상을 먼저 이해할 수 있다.
- 이미지별 성과는 한 광고당 한 슬라이드로 분리했다. 성과 슬라이드의 광고 이미지 렌더 영역은 `285 × 318`이며 원본 4:5 비율 전체가 잘리지 않고 보인다.
- 총 11장 모두 16:9 비율 `1.7778`, 가로·세로 overflow 0px이다.
- 광고 이미지 8개가 정상 로드된다. 첫 요약 4개와 이미지별 성과 4개이며 랜딩 화면 이미지는 포함하지 않았다.
- 광고 이미지와 텍스트 링크 12개가 네 예약 URL로 연결된다.

## Comparison history

1. 기존 구성
   - 한 슬라이드에 광고 두 장을 넣어 소재 카피와 인물이 작게 보였다.
2. 확대 수정
   - 네 소재를 각각 독립 16:9 슬라이드로 분리하고 이미지 영역을 크게 확장했다.
   - 이미지 요소를 고정 영역 안에 배치하고 `object-fit: contain`을 유지해 하단이 잘리지 않게 했다.
3. 흐름 수정
   - 표지 바로 다음에 네 광고 이미지를 한 번에 보는 요약 슬라이드를 추가했다.
   - 이후 결론, 예산 비교, 이미지별 상세 성과 순서로 읽히게 재배치했다.

## Primary interactions tested

- 전체 문서 세로 스크롤
- 첫 광고 요약 이미지 4개 로딩
- 이미지별 성과 슬라이드 4개 로딩
- 광고 이미지·텍스트 링크의 네 예약 URL 계약

final result: passed

---

# 맛핀 세로 릴스 UI Design QA

## 비교 대상

- landing reference: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`
- product implementation: `/matpin/saved` → `/matpin/station/역삼역` → `/matpin/reel/DbTBhcZNY1b`
- source media: Instagram Reel 규격의 9:16 세로 영상 및 세로 AI 썸네일

## Findings

- P0/P1/P2 잔여 이슈 없음.
- 랜딩은 제품의 동작을 설명하는 10장 모션 이야기로 유지하고, 실제 제품은 보관함·역별 목록·영상 상세의 독립적인 앱 구조를 유지했다.
- 보관함의 대표 릴스, 역별 2열 목록, 영상 상세, 공유·전송·역 저장·결과 모형을 모두 `aspect-ratio: 9 / 16`으로 통일했다.
- 가로형 카드 안에 세로 이미지를 억지로 자르던 4:5 및 고정 높이를 제거했다.
- 공유 장면은 세로 릴스 위에 Instagram 공유 시트가 올라오며, 결과 장면은 서로 다른 세로 릴스 3개가 역별 보관함에 정리된다.

## Visual evidence

- 실제 앱: `/tmp/matpin-vertical-saved.png`, `/tmp/matpin-vertical-station.png`, `/tmp/matpin-vertical-detail.png`
- 모션 랜딩: 공유 버튼, 공유 대상, 단서 읽기, 역 저장, 역별 보관함, DM 결과 장면을 개별 확인했다.
- 실제 원본 영상 `yeoksam-sanjang-reel.jpg`는 1080×1920이며, 상세 화면에서 9:16 비율 전체를 유지한다.

## Primary interactions tested

- 랜딩의 `다음` 버튼으로 10개 장면 이동
- Instagram 공유 버튼 → matpin.kr 선택 → 장소 단서 읽기 → 역별 보관함 저장 흐름
- 보관함 → 역삼역 목록 → 릴스 상세 화면 이동
- 세로 영상 재생 컨트롤과 상세 하단 액션 노출

## Verification

- `npm run typecheck`: passed
- ESLint: passed for Matpin mobile frame, saved, station, reel detail
- `npm run test:unit`: 45 files, 294 tests passed
- `git diff --check`: passed for the three changed source files

final result: passed

---

# 맛핀 1단계 CTA·릴스 4장 Design QA

## Comparison target

- source visual truth: `/tmp/matpin-hero-before.png` (1300 × 1040, 브라우저 주석 전 상태)
- implementation: `http://127.0.0.1:3107/matpin/motion-lab/mobile-frame`, scene 01
- target state: CTA 1개, 2×2 릴스 4장 중 아래 행 일부가 목업 하단에서 잘리는 상태

## Findings

- 코드 기준 CTA는 Instagram 이동 링크 하나만 남고 `흐름 보기` 버튼은 제거됐다.
- 목업 데이터는 2개에서 4개로 늘었으며 기존 2열 9:16 그리드와 고정 높이 `overflow: hidden`을 유지해 아래 행이 자연스럽게 잘린다.
- 853 × 1844 배경 이미지는 390 × 844 화면과 같은 세로 비율을 유지하며 `object-position: center`로 고정했다.
- 타입 검사, ESLint, 단위 테스트 294개, `git diff --check`는 통과했다.

## Blocker

- 수정 후 로컬 URL에 대한 인앱 브라우저 접근이 URL 보안 정책으로 차단되어 렌더 결과 캡처와 관련 Playwright 시각 검증을 실행하지 못했다.
- 기존 사용자 탭에 개발 서버의 HMR이 반영될 수 있으나, 이를 검증 완료로 간주하지 않는다.

final result: blocked

---

# 맛핀 모션 랜딩 통합 Design QA

## 비교 대상

- source visual truth: `/tmp/matpin-design-qa/source-motion-lab-scene-1.png`, 1300 × 1040
- implementation: `http://127.0.0.1:3107/matpin`
- desktop implementation: `/tmp/matpin-design-qa/implementation-main-desktop-1.png`, 1300 × 1040
- combined comparison: `/tmp/matpin-design-qa/combined-main-desktop.png`, 2600 × 1040
- mobile implementation: `/tmp/matpin-design-qa/implementation-main-mobile-1.png`, 390 × 844
- target state: 첫 장면, Instagram CTA 1개, 내부 보관함 UI와 세로 릴스 4개

## Findings

- P0, P1, P2 잔여 이슈 없음.
- 기존 Motion Lab의 첫 장면과 10장 모션 흐름을 `/matpin` 첫 화면에 통합했다.
- 실험 경로의 상단 미리보기 바는 `/matpin`에서 제거하고, 별도 Motion Lab 경로에는 유지했다.
- 모바일 390 × 844에서 핸드폰 목업은 `x=8`, `y=33.82`, `width=374`, `height=776.36`으로 화면 안에 전부 들어온다.
- 핸드폰 내부 화면은 `x=21.29`, `y=47.11`, `width=345.64`, `height=748`이며 제목, 설명, CTA, 보관함 UI, 세로 릴스 4개가 첫 화면 안에서 보인다.
- 데스크톱 비교에서 구현 화면은 원본보다 핸드폰을 조금 더 크게 사용하지만, 프레임과 내부 UI는 잘리지 않으며 요청한 첫 화면 집중도가 높아졌다.
- `tastepin_landing_viewed`, `tastepin_primary_cta_clicked` 분석 계약과 Instagram 링크를 유지했다.

## Comparison history

1. 통합 전
   - Motion Lab은 별도 경로에만 있었고 `/matpin`은 다른 랜딩을 사용했다.
2. 구조 수정
   - 같은 모션 컴포넌트에 `landing` 변형을 추가했다.
   - 랜딩 변형에서는 실험용 상단 바를 숨기고 전체 높이를 첫 화면에 맞췄다.
   - 접근 가능한 첫 제목과 기존 분석 이벤트를 연결했다.
3. 화면 수정
   - 핸드폰 목업과 내부 UI가 390 × 844 안에서 전부 보이도록 배율과 정렬을 확인했다.
   - 첫 보관함 UI에서 서로 다른 세로 릴스 4개가 한 번에 보이게 유지했다.
4. 상호작용 수정
   - 첫 장면 스와이프로 scene 01에서 scene 02로 이동했다.
   - `장소 확인`으로 scene 06, `결과 보기`로 scene 10에 이동하며 콘솔 경고와 오류가 없었다.

## Primary interactions tested

- 첫 장면 Instagram CTA 노출과 링크 계약
- 핸드폰 내부 스와이프 장면 이동
- 장소 확인과 결과 보기 장면 이동
- 이전 `/matpin/start`, `/matpin/dm`, `/matpin/import` 진입점의 새 랜딩 연결
- 개인 보관함, 검색, 역별 목록, 릴스 상세의 기존 대표 경로

## Verification

- `npm run typecheck`: passed
- 관련 단위 테스트: 3개 파일, 36개 테스트 passed
- `tests/e2e/matpick.spec.ts`: 8개 테스트 passed
- 인앱 브라우저 콘솔 경고와 오류: 0개
- `git diff --check`: passed

final result: passed

---

# 맛핀 첫 장면 내부 UI 안착 Design QA

## 비교 대상

- source visual truth: `/tmp/matpin-ui-anchor-qa/before.png`, 1300 × 1040
- background source: `public/images/matpin/matpin-poly-workspace-viewer-v2.png`, 853 × 1844
- implementation: `http://127.0.0.1:3107/matpin`, scene 01
- implementation screenshot: `/tmp/matpin-ui-center-qa/after.png`, 1300 × 1040
- mobile screenshot: `/tmp/matpin-ui-anchor-qa/after-mobile-390x844.png`, 390 × 844
- full comparison evidence: `/tmp/matpin-ui-center-qa/before-after.png`, 2600 × 1040
- density normalization: 브라우저 캡처와 CSS 좌표를 같은 1배 밀도로 비교했다.

## Findings

- 초기 P1: 제품 UI 폭이 164px라 사진 속 검은 핸드폰 화면보다 약 22% 컸다. 좌우 프레임을 덮어 별도 카드처럼 보였다.
- 2차 P2: 기기 화면 중앙에 맞춘 `left 129px`이 사진 속 핸드폰의 광학 중심보다 오른쪽으로 약 3px 치우쳐 보였다.
- 수정 후 P0, P1, P2 잔여 이슈 없음.
- 내부 UI를 `132 × 284px`로 줄이고 `left 126px`, `top 318px`에 배치했다. 사진 속 핸드폰 화면의 좌우와 상하 테두리가 모두 보인다.
- 모바일 390 × 844에서 내부 UI는 `116.99 × 251.70px`로 비례 축소되며, 핸드폰 프레임과 화면 밖으로 넘치지 않는다.
- 헤더, 본문 글자, 아이콘, 릴스 간격과 모서리도 같은 비율로 축소해 내부 밀도를 유지했다.
- 제목, 설명, Instagram CTA의 위치와 10장 모션 흐름은 변경하지 않았다.

## Required fidelity surfaces

- 폰트와 타이포그래피: 내부 UI의 제목과 보조 문구를 화면 폭에 맞춰 축소했고, 바깥 랜딩 카피 위계는 유지했다.
- 간격과 레이아웃: 사진 속 물리 핸드폰 화면의 네 변 안에 UI가 들어간다. 390px 화면의 가로 overflow는 없다.
- 색상과 토큰: 기존 검정 제품 UI와 맛핀 강조색을 유지했다.
- 이미지 품질: 배경 사진은 다시 자르거나 늘리지 않았다. 릴스 4개의 원본 이미지와 9:16 비율을 유지했다.
- 카피와 콘텐츠: 기존 문구와 실제 Instagram 링크 계약을 유지했다.

## Comparison history

1. 수정 전
   - UI가 사진 속 핸드폰보다 넓어 좌우 프레임을 덮었다.
2. 수정
   - UI 폭을 164px에서 132px로 줄이고 사진 속 화면 중심으로 이동했다.
   - 내부 글자, 여백, 아이콘, 카드 간격과 모서리를 함께 축소했다.
3. 수정 후
   - `/tmp/matpin-ui-anchor-qa/before-after.png`의 오른쪽 화면에서 사진 속 핸드폰 테두리와 UI가 분리되어 보인다.
   - `/tmp/matpin-ui-anchor-qa/after-mobile-390x844.png`에서 모바일 축소 상태도 같은 정렬을 유지한다.
4. 광학 중심 보정
   - 사진 속 핸드폰은 기기 화면 중심보다 약 3px 왼쪽에 있어 UI를 `left 126px`로 이동했다.
   - `/tmp/matpin-ui-center-qa/before-after.png`의 오른쪽 화면에서 좌우 테두리 여백이 균형을 이룬다.

## Verification

- `npm run typecheck`: passed
- 관련 단위 테스트: 3개 파일, 36개 테스트 passed
- 모바일 랜딩 E2E 테스트: 1개 passed
- 인앱 브라우저 콘솔 경고와 오류: 0개
- `git diff --check`: passed

final result: passed

---

# 맛핀 첫 장면 여러 역 보관함 Design QA

## 비교 대상

- source visual truth: `/tmp/matpin-multi-station-qa/before.png`, 1300 × 1040
- actual product UI: `/tmp/matpin-multi-station-qa/saved-reference-mobile.png`, 390 × 844
- implementation: `http://127.0.0.1:3107/matpin`, scene 01
- desktop implementation: `/tmp/matpin-multi-station-qa/after-desktop-final.png`, 1300 × 1040
- mobile implementation: `/tmp/matpin-multi-station-qa/after-mobile-final.png`, 390 × 844
- full comparison evidence: `/tmp/matpin-multi-station-qa/full-before-after.png`, 2600 × 1040
- focused UI comparison: `/tmp/matpin-multi-station-qa/actual-ui-comparison.png`, 780 × 844
- density normalization: 실제 보관함과 모바일 구현은 390 × 844로 맞췄다. 작은 제품 UI는 같은 높이로 확대해 구조를 비교했다.

## Findings

- 초기 P1: 첫 화면은 역삼역 한 곳과 2열 릴스 4개만 보여 역별 보관함이라는 제품 결과가 충분히 드러나지 않았다.
- 초기 P2: 하단 릴스가 카드 끝에 걸쳐 애매하게 잘려 스크롤이 이어진다는 인상을 주지 못했다.
- 수정 후 P0, P1, P2 잔여 이슈 없음.
- 실제 보관함의 `저장한 역`, 검색, 역 제목, 영상 수, 3열 세로 릴스 구조를 작은 제품 UI에 옮겼다.
- 역삼역과 성수역 두 구간, 세로 릴스 6개를 배치해 여러 역에 영상이 쌓인다는 결과가 보인다.
- 두 번째 역의 릴스는 전체 높이 57.77px 중 38.35px가 보여 노출 비율이 66.38%다.
- 사진 속 핸드폰 화면의 좌우 정렬과 기존 랜딩 제목, 설명, CTA는 유지했다.

## Required fidelity surfaces

- 폰트와 타이포그래피: 실제 보관함의 작은 주황색 눈썹 문구, 큰 `저장한 역`, 역 이름과 영상 수 위계를 축소해 유지했다.
- 간격과 레이아웃: 검색창 다음에 역별 3열 릴스가 이어지는 실제 제품 순서를 사용했다. 두 번째 역 릴스는 화면 하단에서 약 3분의 2만 보인다.
- 색상과 토큰: 실제 보관함의 검정 배경, 회색 검색 표면, 주황색 강조를 유지했다.
- 이미지 품질: 기존 AI 세로 릴스 6개를 9:16 비율로 사용하며 늘이거나 가로형으로 바꾸지 않았다.
- 카피와 콘텐츠: `내 맛집 릴스 보관함`, `저장한 역`, `역삼역`, `성수역`, 영상 수를 표시했다.

## Comparison history

1. 수정 전
   - 역삼역 한 곳과 2열 릴스 4개만 보였다.
   - 하단 사진이 카드 끝에서 애매하게 잘렸다.
2. 실제 UI 전이
   - `/matpin/saved`의 모바일 보관함에서 요약, 검색, 역별 제목, 3열 릴스 구조를 확인했다.
   - 같은 구조를 첫 화면의 사진 속 핸드폰에 축소 적용했다.
3. 여러 역 추가
   - 역삼역과 성수역을 연속으로 배치하고 각 역에 세로 릴스 3개를 넣었다.
4. 하단 노출 보정
   - 두 번째 역 위 간격을 조정해 하단 릴스의 66.38%만 보이도록 했다.
   - `/tmp/matpin-multi-station-qa/actual-ui-comparison.png`에서 실제 보관함과 같은 읽기 순서를 확인했다.

## Verification

- `npm run typecheck`: passed
- 관련 단위 테스트: 3개 파일, 36개 테스트 passed
- 모바일 랜딩 E2E 테스트: 1개 passed
- 인앱 브라우저 콘솔 경고와 오류: 0개
- `git diff --check`: passed

final result: passed

---

# 맛핀 온보딩 CTA Design QA

## 비교 대상

- reference evidence: Beli, ChatGPT, Canopi, Collect의 캐시된 Mobbin 화면 4개
- research report: `docs/research/mobbin/matpin-onboarding-cta-2026-08-07.md`
- before: `/tmp/matpin-cta-qa/after.png`, `matpin.kr 열기`
- after: `/tmp/matpin-cta-qa/final.png`, `Instagram에서 시작하기`
- comparison: `/tmp/matpin-cta-qa/cta-copy-comparison.png`, 2600 × 1040

## Findings

- `matpin.kr`는 제목 아래 설명에 이미 노출되므로 버튼에서 다시 말하면 새 정보가 되지 않았다.
- 버튼을 눌러도 저장이 즉시 완료되지 않고 Instagram 프로필로 이동한다. 따라서 `저장하기` 또는 `릴스 보내기`는 실제 동작보다 앞선 결과를 약속한다.
- Mobbin 화면 4개를 OCR로 확인했다. Beli, ChatGPT, Canopi는 브랜드 주소보다 시작 행동과 핵심 과업을 CTA에 쓴다.
- Collect의 시스템 공유 시트에서는 목적지를 고르는 맥락이라 앱 이름이 중요했다. 랜딩 CTA와 공유 대상은 역할이 다르다.
- 첫 장면과 마지막 장면의 CTA를 `Instagram에서 시작하기`로 통일했다.

## Layout verification

- CTA 영역: x 562px, y 352px, width 174px, height 42px
- CTA와 제품 UI 사이에는 57px의 세로 간격이 남는다.
- 문서 가로 overflow는 0px다.
- OCR에서 `Instagram에서 시작하기`가 한 줄로 확인됐다.
- 전후 비교에서 버튼 폭과 배치는 유지하고 문구만 행동 중심으로 바뀌었다.

## Verification

- `macvis doctor`: OCR available
- reference OCR: 4개 완료
- implementation OCR: 완료
- 인앱 브라우저 DOM: CTA 링크와 Instagram 프로필 URL 확인
- `npm run typecheck`: passed
- 관련 단위 테스트: 3개 파일, 36개 테스트 passed
- 모바일 랜딩 E2E 테스트: 1개 passed
- `git diff --check`: passed

final result: passed

---

# 맛핀 8장면과 반복 DM Design QA

## 비교 대상

- reference: `docs/research/product-design/poly-matpin-timeline-audit-2026-08-07/poly-vs-matpin-timeline-comparison.png`
- before: `docs/research/product-design/poly-matpin-timeline-audit-2026-08-07/matpin-10.png`
- implementation: `docs/research/product-design/poly-matpin-8-scene-qa-2026-08-07/matpin-08-final.png`
- flow contact sheet: `docs/research/product-design/poly-matpin-8-scene-qa-2026-08-07/matpin-8-scene-contact-sheet.png`
- viewport: 1300 × 1040, device screen: 390 × 844

## Findings

- 10개 장면에서 내부 처리 설명 2개를 제거해 8개 장면으로 줄였습니다.
- `캡션부터 장소를 찾아요`를 삭제하고 릴스가 가까운 역에 저장되는 변환 장면에 결과를 모았습니다.
- 마지막 장면은 서로 다른 세로 릴스 3개가 역삼역, 성수역, 을지로입구역에 저장된 DM 목록을 보여줍니다.
- DM 아래에는 `역 3개, 릴스 12개` 요약과 보관함 진입 행동을 배치해 반복 저장이 한 계정에 누적된다는 점을 증명합니다.
- 첫 검사에서 DM 목록과 보관함 요약이 10px 겹쳤습니다. 요약 카드의 시작 위치를 20px 내리고 CTA 위 20px 간격을 확보했습니다.

## Layout verification

- DM 목록: y 440px, bottom 703.98px
- 보관함 요약: y 714px, bottom 778px
- CTA: y 798px, bottom 846px
- DM 목록과 보관함 요약 사이 간격: 10.02px
- 보관함 요약과 CTA 사이 간격: 20px
- 문서 가로 overflow: 0px
- OCR에서 제목, 세 건의 역별 저장 결과, 보관함 요약, CTA를 확인했습니다.

## Verification

- `macvis doctor`: OCR available
- 최종 장면 OCR: 완료
- 인앱 브라우저 레이아웃 측정: 겹침 없음
- 인앱 브라우저 DOM: 8개 장면, DM 3개, 보관함 요약 확인
- `npm run typecheck`: passed
- 관련 단위 테스트: 3개 파일, 36개 테스트 passed
- 모바일 랜딩 E2E 테스트: 1개 passed
- `git diff --check`: passed

final result: passed
