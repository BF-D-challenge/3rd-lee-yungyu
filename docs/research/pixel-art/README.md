---
name: pixel-art--campfire-box-shadow-reference
description: 첨부된 캠프파이어 SCSS 원문을 무손실 보존하고, 4px 앵커와 box-shadow 좌표로 정적 장면·프레임 애니메이션을 만드는 원리 및 React 재사용 구조를 설명한다.
metadata:
  type: research
  topic: pixel-art
  category: reference
  date: 2026-07-12
---

# 캠프파이어 box-shadow 픽셀 레퍼런스

이 폴더는 하나의 4×4px 요소를 수천 번 복제해 캠프파이어 픽셀 장면을 그리는 SCSS 원본과 그 작동 원리를 보존한다.

## 원본 무결성

보존 파일: [campfire-box-shadow-reference.scss](campfire-box-shadow-reference.scss)

| 항목 | 값 |
|---|---|
| 원본 SHA-256 | `ef7da51ed470063797358ef340bbad905bf712b8c1e0e02d0ff5d46f7346fecc` |
| 바이트 | `166,917` |
| 논리적 줄 수 | `29` |
| LF 문자 수 | `28` (`wc -l` 결과) |
| 인코딩 | ASCII |
| 파일 끝 | 마지막 줄 뒤 개행 없음 |

논리적 줄 수와 `wc -l` 값이 다른 이유는 원본 마지막에 줄바꿈 문자가 없기 때문이다. 이 끝 상태까지 원문 그대로 보존했다.

## 어떻게 한 점이 그림이 되는가

### 1. 4px 픽셀 그리드

`body::before`와 `body::after`는 모두 너비와 높이가 `4px`인 작은 사각형 하나다. 긴 `box-shadow` 목록의 x·y 좌표도 4px 단위로 이동한다. 따라서 화면의 한 픽셀 칸은 실제 CSS에서 4×4px 블록 하나가 된다.

`left`, `top`, `transform`은 완성된 장면 전체를 화면에 놓는 좌표다. 픽셀 그림 자체의 그리드와는 별개다.

### 2. 단일 4×4 앵커와 box-shadow 좌표

일반적인 `box-shadow`는 그림자를 흐리게 만들지만, 이 원본은 다음처럼 흐림값 없이 사용한다.

```scss
box-shadow:
  128px 204px rgb(165, 120, 138),
  132px 204px rgb(250, 141, 124);
```

각 항목은 `x 위치, y 위치, 색`이다. 브라우저는 원래 4×4px 사각형을 해당 위치에 같은 크기로 복제한다. 수천 개의 좌표를 이어 붙이면 별도의 이미지 파일이나 수천 개의 DOM 요소 없이 하나의 픽셀 장면이 된다.

### 3. ::before는 움직이지 않는 정적 레이어

`::before`의 `box-shadow` 목록은 프레임이 바뀌어도 유지되는 장면을 담당한다. 어두운 윤곽, 바닥, 주변 구조와 고정된 반사광을 한 번 그린다.

정적 레이어를 애니메이션에서 분리하면 매 프레임마다 변하지 않는 픽셀까지 반복해서 선언하지 않아도 된다. 원본의 `::before`에는 2,394개의 shadow 항목이 있다.

### 4. ::after는 바뀌는 프레임 레이어

`::after`는 `animate` 키프레임만 담당한다. 원본은 0%, 16.666…%, 33.333…%, 50%, 66.666…%, 83.333…%, 100% 지점을 가지며, 실제로는 서로 다른 6개 프레임과 마지막 프레임을 한 번 더 유지하는 100% 지점으로 구성된다.

밝은 불꽃과 프레임마다 흔들리는 광원 픽셀만 이 레이어에서 교체된다. 정적 장면은 아래의 `::before`에 그대로 남는다.

### 5. steps(1, end)가 픽셀 프레임을 지키는 이유

```scss
animation: animate .5s infinite steps(1, end);
```

일반 애니메이션은 두 좌표 사이를 부드럽게 보간해 픽셀이 미끄러지거나 색이 섞인다. `steps(1, end)`는 현재 프레임을 그대로 유지하다가 경계에서 다음 프레임으로 한 번에 바꾼다. 그래서 불꽃이 흐려지지 않고 고전 게임처럼 딱딱 끊겨 움직인다.

### 6. 팔레트·광원·바닥빛·프레임을 나누는 법

원본은 역할에 따라 색의 밝기를 나눈다.

- 캔버스: `#5f6171`의 회청색 배경
- 구조와 윤곽: `rgb(38, 29, 35)`, `rgb(52, 34, 45)`, `rgb(60, 61, 70)`
- 중간톤과 바닥 반사: `rgb(76, 53, 68)`, `rgb(118, 80, 95)`, `rgb(165, 120, 138)`
- 움직이는 불꽃과 강한 광원: `rgb(189, 65, 105)`, `rgb(250, 141, 124)`

어두운 구조와 바닥빛은 주로 정적 레이어에 두고, 밝고 형태가 변하는 픽셀은 프레임 레이어에 둔다. 이 분리 덕분에 불꽃만 움직여도 주변 바닥이 계속 빛을 받고 있는 것처럼 보인다.

## React에서 재사용하는 권장 구조

```text
CampfirePixel/
├── CampfirePixel.tsx
├── CampfirePixel.module.scss
├── campfire-static.generated.scss
└── campfire-frames.generated.scss
```

- `CampfirePixel.tsx`: `<span aria-hidden="true" />` 같은 앵커 하나만 렌더한다. 픽셀마다 React 요소를 만들지 않는다.
- `CampfirePixel.module.scss`: 로컬 배치, 크기 조절, `::before`·`::after` 공통 규칙을 가진다.
- `campfire-static.generated.scss`: 원본 `::before`의 정적 좌표를 담당한다.
- `campfire-frames.generated.scss`: 원본 `@keyframes animate`의 프레임 좌표를 담당한다.

권장 사용 원칙:

1. 이 폴더의 원본은 무결성 확인용으로 유지하고 런타임에서 직접 수정하지 않는다. 파생 파일에는 원본 SHA-256을 주석으로 남긴다.
2. 크기는 좌표를 다시 계산하지 말고 바깥 래퍼의 `transform: scale(...)`로 조절한다. `transform-origin`도 함께 고정한다.
3. 위치는 `body`의 음수 `left` 값을 그대로 쓰지 말고, `position: relative`인 컴포넌트 컨테이너 안에서 로컬 원점을 새로 잡는다.
4. `pointer-events: none`, `aria-hidden`, `contain: paint`로 장식 요소임을 명확히 하고 주변 UI와 페인트 범위를 분리한다.
5. `prefers-reduced-motion`에서는 애니메이션을 없애기만 하지 말고 `::after`를 대표 프레임 하나의 정적 shadow로 고정한다.
6. React state나 `setInterval`로 프레임을 바꾸지 않는다. 한 DOM 앵커와 CSS 키프레임을 유지해야 렌더 비용과 구조가 단순하다.

## 원본을 변경해야 할 때

원본을 직접 고치지 말고 새 파생 파일을 만든다. 변경 전후에는 다음 세 값을 다시 확인한다.

```sh
shasum -a 256 docs/research/pixel-art/campfire-box-shadow-reference.scss
wc -c -l docs/research/pixel-art/campfire-box-shadow-reference.scss
cmp /원본/경로 docs/research/pixel-art/campfire-box-shadow-reference.scss
```

`cmp`가 아무 출력 없이 종료 코드 0을 반환해야 바이트 단위로 동일하다.
