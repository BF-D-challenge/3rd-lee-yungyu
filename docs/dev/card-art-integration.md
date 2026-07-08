# 카드 아트 연결 가이드 — 타로 덱 · 3티어 (v3)

> 목업: 세션 Artifact "타로 덱 · 3티어 아트 시스템". 값 수백 개를 **그림 10장 + 뒷면**으로 커버.
> 원칙: 일러스트는 수트의 무드, **카투슈의 이름**이 구체 값. 경로는 [`lib/card-art.ts`](../../src/lib/card-art.ts), 렌더는 [`components/organisms/slot/tarot-card.tsx`](../../src/components/organisms/slot/tarot-card.tsx).
> ⚠ slot-cell / fan-deck / slot-machine / taste-sheet는 **다른 세션 편집 중** — 아래는 그 세션이 적용할 패치. 나는 card-art.ts·tarot-card.tsx·자산·문서만 건드림.

## 1. 3티어 아트 시스템

| 티어 | 대상 | 그림 | 모듈 심볼 |
|---|---|---|---|
| **1 · 씨앗 수트** | 카테고리 6 (fitness/food/content/dev/commerce/marketing) | 6 | `CATEGORY_ART[id]` · `seedArt(seedId)` |
| **2 · 4축** | 불편·형태·장면·마음 (보편 아르카나) | 4 | `AXIS_ART[axis]` |
| **뒷면** | 덱·플립 전 | 1 | `CARD_BACK` |
| **3 · 결과 히어로** | 확정·공유 카드 | (조합) | 씨앗 아트를 크게 + Veo 모션 |

핵심 리졸버 — 슬롯에 놓인 값 하나의 아트:
```ts
import { artForValue } from "@/lib/card-art";
const src = artForValue(v); // 씨앗이면 그 카테고리 아트, 그 외 축이면 축 아트
```

## 2. 렌더 — `TarotCard` (컨테이너 쿼리 자동 스케일)

`slot-cell.tsx` 앞면을 `TarotCard`로 교체(또는 감싸기). 한 컴포넌트가 슬롯~히어로까지 cqi로 스케일.

```tsx
import { TarotCard } from "@/components/organisms/slot/tarot-card";
import { artForValue, CATEGORY_NUMERAL, CARD_BACK } from "@/lib/card-art";

// 앞면 (슬롯: compact) — 값 v(AxisValue), axisLabel(씨앗/불편…), accent(수트색)
<TarotCard art={artForValue(v)} suit={axisLabel} name={displayName} accent={accent} compact />

// 앞면 (결과 히어로: 풍부하게)
<TarotCard art={artForValue(v)} suit={axisLabel} name={displayName} accent={accent}
           numeral={CATEGORY_NUMERAL[catId]} />

// 뒷면 (플립 전 / 덱)
<TarotCard art={CARD_BACK} back />
```
- `compact` = 작은 슬롯: 로마숫자·코너·수트 라벨 숨기고 이름만 크게 + 스크림 강화(가독성).
- **여러 장 렌더 시 CSS 중복 방지**: 첫 장만 기본(`injectStyle` 생략), 나머지는 `injectStyle={false}`. 또는 앱 전역에 CSS 한 번 주입.
- 수트 액센트 hex: 씨앗=값의 카테고리색 / 불편 `#e0607a` · 형태 `#39c9b0` · 장면 `#5b8bff` · 마음 `#b39cff`.
- `--font-serif` 변수(app/layout.tsx Playfair)를 그대로 상속 — 카투슈·로마숫자가 세리프로.

## 3. 슬롯 뽑기 화면 (slot-cell / slot-machine)

- 앞면: 위 `<TarotCard ... compact />`. 기존 `{shown?.emoji}` 중앙 이모지·수동 텍스트는 제거.
- 뒷면: `<TarotCard art={CARD_BACK} back />` (또는 기존 backSvg 유지). 축 힌트가 필요하면 compact 앞면의 수트색으로 충분.
- `accent`/`name`은 slot-machine의 cellContent에서 값에 맞춰 전달 (씨앗은 `categoryOfSeed(seed.id)`로 카테고리색).

## 4. 카테고리 선택 (taste-sheet / onboarding)

카테고리 칩을 `CATEGORY_ART`로 — `TarotCard` 없이 배경만 써도 됨:
```tsx
import { CATEGORY_ART, type CategoryId } from "@/lib/card-art";
<div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
  <img src={CATEGORY_ART[c.id as CategoryId]} className="absolute inset-0 h-full w-full object-cover" alt="" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
  <span className="absolute bottom-2 left-3 font-serif text-white">{c.label}</span>
</div>
```

## 5. 결과·공유 카드 (티어 3) + Veo 모션

- 확정 카드(confirm-branch/결과)는 씨앗 아트를 **큰 히어로**로: `<TarotCard ... />`(compact 아님, 창이 큼).
- **Veo 모션은 여기에만** — 스틸을 first frame으로 image-to-video 루프. 스크립트 `scratchpad/veo_gen.py`(모델 `veo-3.1-lite-generate-preview`), 키 `.env`의 `ALLSALE_GEMINI_API_KEY`. 비용 발생 → 승인 후.

## 6. 자산 · 소유권

- 자산: `public/cards/aurora/category/*.png`(6) · `axis/{pain,format,situation,psych}.png`(4) · `back.png`(1). 씨앗 축 자체 아트는 카테고리로 대체(seedArt).
- 골드 v1(`public/cards/back.png`·`domain/`)은 `LEGACY_GOLD`로 보존.
- 렌더 파일 편집은 그 세션과 조율. 나: `lib/card-art.ts`·`tarot-card.tsx`·`public/cards/aurora/*`·문서.
