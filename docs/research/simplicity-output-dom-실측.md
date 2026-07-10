---
name: simplicity-output-dom-실측
description: toss.im/simplicity 결과·상세 화면의 DOM 변화를 CDP+MutationObserver로 실측한 문서 — 애니메이션은 인라인 style 뮤테이션(RAF), 뷰 전환은 DOM 통째 교체, 스토리형 상세 UI(세그먼트 진행바+중앙 카드+가라오케 자막+원형 컨트롤), 가라오케 자막의 단어 분해+인라인 duration 메커니즘을 밝히고 "오늘 해볼까" 결과 화면 이식 설계표를 도출했다.
metadata:
  type: reference
  topic: simplicity-output-dom
  category: field-measurement
  date: 2026-07-06
---

# toss.im/simplicity — Output(결과·상세) 화면 DOM 변화 실측

> 2026-07-06 CDP(9222) 실측. MutationObserver를 라이브 페이지에 주입해 상태 전환별 DOM 변화를 캡처.
> 목적: "오늘 해볼까" 결과(output) 화면·슬롯릴 모션을 Simplicity 방식으로 구현하기 위한 1차 근거.
> 선행 문서: `/Users/yungyulee/Project/00_ADD/allsale-ops-admin/docs/references/simplicity/README.md` (시각 토큰·모션 값) — 이 문서는 그 후속으로 **DOM이 실제로 어떻게 바뀌는지**를 다룬다.

## 핵심 결론 (한 줄씩)

1. **애니메이션 = 인라인 style 뮤테이션.** 클래스 토글·노드 추가삭제가 아니라, framer-motion(RAF)이 프레임마다 `style=""`를 다시 쓴다. 정지 상태에서도 idle 3초에 2,554건.
2. **뷰 모드 전환(펼쳐보기↔모아보기) = DOM 통째 교체.** 613노드(캐러셀) → 276노드(리스트). CSS로 같은 DOM을 변형하지 않는다.
3. **상세(output) 진입 = SPA 라우팅 + 스토리 UI.** `/simplicity/sessions/{slug}`. 챕터 세그먼트 진행바 + 중앙 미디어 카드 + 가라오케 자막 + 원형 컨트롤.
4. **가라오케 자막 = 단어 분해 + 인라인 animation-duration 주입.** 유일하게 childList가 움직이는 곳. 줄 교체는 노드 스왑, 채움은 CSS keyframes.

## 1. 홈 캐러셀(펼쳐보기 모드) — DOM 고정, style만 흐른다

- 세션 카드 14장 **전부 상시 마운트** (뷰포트 밖 x=-3,749px 카드도 존재). 가상화 없음. `documentElement overflow: hidden`, 세로 스크롤 0.
- 카드 자신은 `transform: none` 유지. **이동은 부모 컨테이너 transform**, 포커스 표현은 카드의 `opacity` + `height`로:

| 상태 | opacity | height |
|---|---|---|
| 중앙(활성) | 1 | 591.76px |
| 비중앙 | 0.7 | 557.40px (약 −6%) |

- 프레임 단위로 바뀌는 인라인 스타일 (idle+휠 실측 상위):
  - `card-speaker-img`: `opacity` + `transform: translateY(26px→0) scale(0.29→1)` — 연사 사진 떠오름
  - `card-title-container`: `top: 39.5vh→40.0vh` 미세 드리프트 (vh 단위!)
  - `card-intro-effect-N` (카드별 1개): `opacity 0→1→0` 진입 이펙트 레이어
  - `card-mono-gradient` / `card-radial-gradient`: `opacity`만으로 포커스 dim 크로스페이드
  - 배경 이미지: **`filter: blur(30px)` 고정 + `opacity` 크로스페이드** (blur 값 애니메이션 아님 — 성능)
  - `card-preview-video`: 센터 진입 시 `opacity 0→1`
  - `card-speaker`: 글자색 `rgb(255,255,255)→rgba(168,168,168,.7)` — **색상도 RAF로 보간**
- 시사점: 트리는 그리지 않고 고정하고, 눈에 보이는 변화는 전부 `opacity/transform/height/color` 4종의 인라인 보간. GPU 레이어를 만드는 `translateZ(0)`를 transform 끝에 항상 붙인다.

## 2. 모아보기(리스트) 전환 — DOM 교체

- 캐러셀 613노드 → 리스트 276노드로 **unmount/remount**. 상단에 카테고리 탭(`li`: 전체/그래픽 디자인/…) 생성, 세로 리스트(썸네일+카테고리 라벨+제목+연사+설명).
- 토글 pill(radius 50px)은 `span` 위 wrapper `div`에 onclick. **합성 이벤트(el.click(), PointerEvent dispatch)로는 반응 안 함** — CDP 좌표 실클릭만 통함(자동화 시 주의).

## 3. 세션 상세 = Output 화면 (`/simplicity/sessions/{slug}`)

### 구성 (재생 전 → 재생 중)

- 재생 전(타이틀 씬): 풀블리드 배경 + 영문 eyebrow + 큰 제목 + 연사(사진·이름·직함) + "연사자 영상과 음성은 AI로 생성되었어요" 캡션. 좌상단 뒤로가기, 우상단 음소거·공유 원형 버튼.
- **화면 아무 데나 클릭 → 재생 시작** (video 2개: 본편 mp4 + 연사 프로필 mp4, audio 1개 나레이션).
- 재생 중(스토리 UI):
  - 상단: **챕터 수만큼 세그먼트 진행바** (인스타 스토리 문법, 지난 챕터는 파란색 채움)
  - 헤더: `연사 · 세션명 | 02. 챕터명 ▾` (챕터 점프 드롭다운)
  - 중앙: 미디어 카드 — `border-radius: clamp(46px, 4.63vh, 60px)`, 살짝 기울어진 채 등장
  - 카드 아래: **가라오케 자막 1줄**
  - 하단: 이전/일시정지/다음 **흰 원형 버튼 3개**
- 씬(챕터) 전환마다 노드 수 변동(370→328): 씬별 미디어를 mount/unmount.

### 재생 중 인라인 style 뮤테이션 (실측 상위)

| 대상 | 변화 | 의미 |
|---|---|---|
| 히어로 컨테이너(css-1tqtsq5) | `will-change: transform; max-width: 800px; transform: translate3d(0,-50px,0) scale(…)` 프레임 갱신 (259×/6s) | 씬 콘텐츠 부상/축소 |
| 미디어 카드(css-143qjb3) | `opacity: 0→…; width/height: 0px→성장; border-radius: clamp(46px,4.63vh,60px)` (183×) | **카드가 0에서 자라나며 등장** |
| 자막 단어 span(css-14ak8w8) | `opacity 1→0.72, position relative→absolute, translateY, color: rgb(75,100,244)` (110×) | 지나간 단어 잔상 처리. 하이라이트 = 토스 블루 `#4B64F4` |
| 씬 이미지 div | `opacity 0→0.15→…` (86×) | 씬 배경 크로스페이드 |

### 가라오케 자막 메커니즘 (childList가 유일하게 움직이는 곳)

```
자막 컨테이너 div.css-pw7jst
 └─ 줄 span.css-1tqm261        ← 줄 교체 시 이 span 자체를 add/remove (스왑)
     └─ div.line.karaoke-text-line   ← ① 처음엔 class="line"
         └─ div.word × N             ← ② 원래 #text 노드를 단어 div로 분해
```

1. 새 줄 진입: 텍스트 노드 제거 → `div.word`들 삽입 (단어 단위 분해)
2. wrapper에 `karaoke-text-line` 클래스 부여 + **인라인 `animation-duration: 7.94017s`** (줄마다 오디오 길이에 맞춰 계산) + `width: 100%→fit-content`
3. 채움 자체는 CSS keyframes (회색→`#4B64F4` 단어 단위) — JS는 duration만 계산
4. 줄 끝: 줄 span 통째 제거, 다음 줄 span 삽입
5. 단어 span 공통: `display: inline-block; position: relative`

## 4. → "오늘 해볼까" 이식 설계

| Simplicity 패턴 | 오늘 해볼까 적용 |
|---|---|
| 스토리형 상세(세그먼트 진행바+중앙 카드+자막+원형 컨트롤) | **S3 결과·공유 화면 골격.** 축 6개 = 세그먼트 6칸, 중앙 = 결과 카드, 자막 = 결과 한 문장 |
| 카드 0→성장 등장 (`width/height/opacity` + `border-radius: clamp()`) | 카드 발행(확정) 순간의 등장 모션 |
| 가라오케(단어 div 분해 + inline duration + keyframes) | 결과 한 문장 스트리밍 노출. 하이라이트는 우리 포인트색(그린~라임) |
| 캐러셀: DOM 고정, `opacity .7↔1` + `height ±6%`, 배경 `blur(30px) 고정+opacity` 크로스페이드 | 슬롯 릴/카드 릴. blur 값 애니메이션 금지, opacity 크로스페이드로 |
| 뷰 전환 = DOM 교체 | 릴↔리스트 등 모드 전환은 조건부 렌더(요소 교체)로. 같은 DOM을 CSS로 비틀지 않기 |
| 색상까지 RAF 보간, transform 끝 `translateZ(0)` | 정적 MVP는 CSS transition으로 근사(RAF 필수 아님), GPU 힌트만 차용 |

## 부록: 재현 스크립트

세션 scratchpad(`.../scratchpad/`)의 `simplicity-dom-probe.mjs`(캐러셀 3단계), `simplicity-detail2.mjs`(상세 진입), `simplicity-detail-tokens.mjs`(재생 관측). Node 22 내장 WebSocket 사용, CDP 9222. 스크린샷: `simplicity-now.png`(캐러셀), `simplicity-list.png`(모아보기), `simplicity-detail.png`(상세 타이틀), `simplicity-detail-play.png`(재생 중).
