# toss.im/simplicity — 인트로 프레임 단위 실측

> 2026-07-06 CDP(9222) 실측. 새 탭 → `bringToFront`(rAF 스로틀 방지) → MutationObserver 주입 → navigate → 첫 15초 300ms 간격 40프레임 + 스타일 뮤테이션 5,514건 캡처.
> 후속 문서: [`research/simplicity-output-dom-실측.md`](../../../research/simplicity-output-dom-실측.md)(output/상세 화면) — 이 문서는 **첫 진입 인트로**만 다룬다.
> 활용처: `prds/오늘-해볼까-개선계획-v4-다크리뉴얼.md` §3.3 인트로 스펙.

## 시퀀스 (프레임 근거)

| 단계 | 시각 | 프레임 | 내용 |
|---|---|---|---|
| A. 워드 등장 | 0~2.2s | [f00](f00-0ms.jpg) → [f05](f05-2244ms.jpg) | 순수 검정(#000) 화면 중앙에 `TOSS` `DESIGN` `CONFERENCE` 작은 대문자 워드가 **자간을 넓게 벌려** 순차 등장 |
| B. 빛줄기 글리치 | 0.5~3.3s | [f05](f05-2244ms.jpg) | 워드 위로 파란 빛줄기가 수평 스윕. **정체 = `video.card-intro-video`(1440×150 스트립, `mix-blend-mode: lighten`)** — 검정 배경 위라 비디오의 검정 픽셀은 사라지고 밝은 빛줄기만 워드를 관통 |
| C. 워드마크 수렴 | ~3.3s | [f08](f08-3312ms.jpg) | 세 워드가 `Simplicity` 워드마크로 수렴(크로마틱 어버레이션 잔상), 화면 가장자리에서 파란 라디얼 글로우 블룸 |
| D. 카드로 안착 | 3.7~4.5s | [f10](f10-4124ms.jpg) → [f11](f11-4510ms.jpg) | 풀블리드 글로우가 **중앙 9:16 카드로 축소(스케일다운)** 되며 좌우 세션 카드들이 드러남 — 인트로 히어로가 그대로 캐러셀의 센터 카드가 됨. 하단 `펼쳐보기` pill 등장 |
| E. 캐러셀 idle | ~8s | [f20](f20-7948ms.jpg) | 헤더(로고·Season4) 정착, 캐러셀 자동 드리프트 시작 |

## 뮤테이션 타임라인 (mutations.json, t=performance.now 기준 ms)

| 대상 | 첫 등장 | 마지막 | 건수 | 역할 |
|---|---|---|---|---|
| `video.card-intro-video` (opening-title-intro/card-sub-pc.mp4) | 528 | 5,395 | 153 | 빛줄기 글리치 스트립 (`mix-blend-mode: lighten`, 1440×150) |
| `video.card-main-video` | 2,535 | 5,460 | 156 | 센터 카드 본편 비디오 프리롤 |
| `div.card-title-container` | 3,743 | 9,927 | 293 | 타이틀 안착 후 `top: vh` 단위 미세 드리프트 |
| `div.card-intro-effect-N` (카드별 1개) | 4,760 | 7,443 | 1,226 | 사이드 카드 진입 이펙트 — `opacity 0.99→…` RAF 보간 페이드 |
| `div.card-mono-gradient` | 4,863 | 6,744 | 106 | 포커스 dim 크로스페이드 |

## 재현 원칙 (오늘 해볼까 이식용)

1. **검정 위 lighten 블렌드**가 글리치의 전부다 — 비디오 없이도 CSS 그라디언트 스트립 + `mix-blend-mode: lighten` + translateX 스윕으로 등가 재현 가능.
2. 인트로의 끝이 **곧 첫 화면의 시작**(히어로가 카드로 축소되며 캐러셀에 안착) — 인트로와 랜딩이 분리된 두 장면이 아니라 하나의 연속 샷. 우리 버전: 워드마크 블룸 → 9:16 카드로 축소 → 하단 부채꼴 덱이 카드 뒤에서 펼쳐짐.
3. 눈에 보이는 변화는 전부 `opacity/transform` 인라인 보간(RAF) — layout 속성을 애니메이션하지 않는다.
4. 스킵 가능해야 함(토스도 클릭/스크롤로 건너뜀). `prefers-reduced-motion` 시 정적 폴백 + 세션당 1회만.

## 원본 캡처

전체 40프레임·스크립트는 세션 scratchpad에서 생성 — 여기엔 결정적 6프레임 + mutations.json + 캡처 스크립트([capture.mjs](capture.mjs))만 이관. 재캡처는 `node capture.mjs <출력폴더>`(CDP 9222 + 탭 활성화 필수).
