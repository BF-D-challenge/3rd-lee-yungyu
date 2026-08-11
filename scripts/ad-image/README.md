# 광고 이미지 생성 시스템

기본 manifest는 v2다. 실제 제품 화면을 이미지 레이어로 넣고,
제목·설명·행동 라벨은 코드로 합성한다. 전체 디자인 판단과 레이어 계약은
과거 설계 계약은 `docs/archive/legacy-root/docs/AD_CREATIVE_SYSTEM_V2.md`에 보존되어 있다.

## 실행

```bash
npm run ad:image:check
npm run ad:image:render
```

한 장만 렌더링할 때:

```bash
npm run ad:image:render -- --id tastepin-01-problem
```

안전 영역을 눈으로 확인할 때:

```bash
npm run ad:image:render -- --debug-safe-area
```

## 한 장씩 세팅하는 순서

1. `config/ad-image/manifest.json`에서 해당 광고를 찾는다.
2. `variables.asset`에 보유 제품 화면이나 직접 촬영한 사진을 넣는다.
3. `headline`, `support`, `foot`, `momentLabel`을 수정한다.
4. 해당 ID만 렌더링한다.
5. `render-report.json`에서 placeholder와 warning이 없는지 확인한다.
6. 문구와 랜딩 URL을 검수한 뒤 해당 시안의 `approval.status`만
   `approved`로 바꾼다.

## 레이어

- `text`, `pill`: 코드로 관리하는 문구
- `rect`, `circle`, `gradient`: CSS와 같은 배치·색상 역할
- `image`: 보유 제품 화면이나 촬영 이미지
- `background.fill`: 생성 이미지가 필요 없는 단색 배경

`publishable`은 이미지가 정상이어도 모든 선택 시안의 승인 상태가
`approved`가 아니면 `false`다. 경쟁사 광고 레퍼런스는 manifest의 이미지
소스로 넣지 않는다.

## v3 — 쌓아 올린 Z축 + Instagram placement

v2는 그대로 보존한다. v3는 다음 파일을 사용한다.

- 광고 15개: `config/ad-image/manifest.v3.json`
- placement와 안전영역: `config/ad-image/placement-profiles.v3.json`
- 렌더러: `scripts/ad-image/render-v3.mjs`
- 설계 계약: `docs/archive/legacy-root/docs/AD_CREATIVE_SYSTEM_V3.md`

검증과 전체 렌더:

```bash
npm run ad:image:v3:check
npm run ad:image:v3:render
```

한 광고 또는 한 placement만 렌더:

```bash
node scripts/ad-image/render-v3.mjs --id onebite-01 --profile ig_feed_portrait
node scripts/ad-image/render-v3.mjs --profile ig_reels --debug-safe-area
```

출력은 `outputs/ad-image-system/v3/<profile>/<creative-id>.png`에 생성된다.
Feed·Explore·Square·Carousel·Stories·Reels가 서로 다른 `stackAnchor`와
안전영역을 사용하며, 단순 자동 crop은 하지 않는다.

v3의 실사 촬영 슬롯과 Reels 모션이 남아 있거나 `approval.status`가
`draft`이면 publish gate는 계속 막힌다.

## 레퍼런스 충실도 소규모 테스트

전체 15개를 다시 그리기 전에 대표 2개를 A/B/C로 비교한다.

```bash
npm run ad:image:reference-lab
```

출력:

- `outputs/ad-reference-tests/2026-07-26/comparison-call.jpg`
- `outputs/ad-reference-tests/2026-07-26/comparison-comic.jpg`
- `outputs/ad-reference-tests/2026-07-26/metrics.json`

이 테스트는 광고 성과가 아니라 구도 충실도 사전 점검이다. 픽셀 거리만으로 고르지 않고
패널 수, 미디어 점유율, 제목 위치, 겹침 순서를 함께 판정한다.
