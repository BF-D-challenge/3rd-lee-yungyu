# 카드 아트 연결 가이드 (오로라 풀블리드 · v2)

> codex `image_gen.imagegen`로 생성한 **오로라 12장**을 라이브 앱에 연결하는 법.
> 모든 경로는 중앙 모듈 [`lib/card-art.ts`](../lib/card-art.ts)에서 import (하드코딩 금지). 프롬프트: `docs/aurora-card-prompts.md`.
> ⚠ **slot-cell.tsx / fan-deck.tsx / slot-machine.tsx / taste-sheet.tsx는 다른 세션이 편집 중일 수 있음.** 아래 패치는 그 세션이 파일을 놓았을 때 적용. 이 문서는 무엇을·어디에·어떻게만 정의한다.

## 1. 자산 인벤토리 (12장, 라이브 모델과 1:1 정합)

| 자산 | 수량 | 모듈 심볼 | 활용처 | 라이브 키 일치 |
|---|---|---|---|---|
| 카테고리 타일 | 6 | `CATEGORY_ART[id]` | 온보딩·취향 카테고리 선택 | combos.json 카테고리 id ✓ |
| 축 카드 | 5 | `AXIS_ART[axis]` | 슬롯 카드 표면(이모지 대체) | lib/pools AxisId ✓ |
| 뒷면 | 1 | `CARD_BACK` | 덱/슬롯 카드 뒷면 | — |

→ 골드 v1과 달리 **재매핑 불필요**: 키가 라이브와 그대로 맞음. 낭비 0.

## 2. 슬롯 카드 표면 — `AXIS_ART` (풀블리드 배경)

오로라는 **카드 전체를 채우는 배경**이다(이모지처럼 중앙 글리프가 아님). `slot-cell.tsx` 앞면에 `<img object-cover>`를 최하단 레이어로 깔고, 그 위에 라벨/제목/서브텍스트가 얹힌다. 가독성은 **CSS 스크림**으로.

```tsx
// slot-cell.tsx — SlotCellProps
artSrc?: string;   // AXIS_ART[axis]

// 앞면 컨테이너 최하단 (배경 레이어)
{artSrc && (
  <>
    <img src={artSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
    {/* 텍스트 가독성 스크림 — 아트엔 굽지 않음 */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
  </>
)}
// 기존 {shown?.emoji} 중앙 이모지는 제거하거나, 축 라벨만 남긴다 (오로라가 축 정체성을 색/구도로 전달).
```
```tsx
// slot-machine.tsx — 셀 렌더
import { AXIS_ART } from "@/lib/card-art";
<SlotCell ... artSrc={AXIS_ART[ax.id]} />
```
- 카드 비율 300:485 ↔ 아트 1024×1536(2:3) 오차 <1.4% → `object-cover`로 흡수.

## 3. 카테고리 선택 — `CATEGORY_ART` (온보딩/취향)

`taste-sheet.tsx`·`onboarding.tsx`의 카테고리 칩/카드(`c.emoji` 표시)를 오로라 타일로:
```tsx
import { CATEGORY_ART, type CategoryId } from "@/lib/card-art";
// 카테고리 카드
<div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
  <img src={CATEGORY_ART[c.id as CategoryId]} alt="" className="absolute inset-0 h-full w-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
  <span className="absolute bottom-2 left-3 text-sm font-medium text-white">{c.label}</span>
</div>
```

## 4. 카드 뒷면 — `CARD_BACK`

현재 `backSvg(glyph)`(SVG 프레임+축 이모지)를 오로라 뒷면 이미지로:
```tsx
import { CARD_BACK, AXIS_ART } from "@/lib/card-art";
// 뒷면 div (slot-cell / fan-deck 공통 backSvg 대체)
<div className="absolute inset-0 overflow-hidden rounded-card" style={{ backfaceVisibility: "hidden" }}>
  <img src={CARD_BACK} alt="" className="absolute inset-0 h-full w-full object-cover" />
  {/* 어느 릴로 가는지 힌트가 필요하면 축 아트를 작게 오버레이 */}
  {axisId && <img src={AXIS_ART[axisId]} alt="" className="absolute inset-0 m-auto h-16 w-16 rounded-lg object-cover opacity-70" />}
</div>
```
- 덱 56장(fan-deck)은 퍼포먼스 민감 → 라스터 배경이 무거우면 뒷면은 슬롯 셀에만 적용하고 덱은 경량 유지, 후속 최적화.

## 5. 모션(후속) — Veo

스틸 확정 완료. 모션은 `docs/aurora-card-prompts.md` §5 — 각 스틸을 first frame으로 Veo image-to-video(카드별 "빛의 동사" 루프). `.env`의 `ALLSALE_GEMINI_API_KEY` 사용, 비용 승인 후.

## 6. 파일 소유권 주의

- `slot-cell.tsx` `fan-deck.tsx` `slot-machine.tsx` `taste-sheet.tsx` = **다른 세션 편집 중.** 위 패치는 조율 후 적용. 나는 `lib/card-art.ts`·`public/cards/aurora/*`·문서만 건드림.
- 골드 v1 자산(`public/cards/back.png`·`axis/`·`domain/`)은 `LEGACY_GOLD`로 보존(삭제 금지, 비교·회귀용).
