# 오늘 해볼까 — 카드 아트 AI 프롬프트 세트 (v1) ⚠ ARCHIVED

> **2026-07-07 아카이브.** 디자인이 오로라 풀블리드로 완전 피벗됨 → 현행 설계: `docs/aurora-card-prompts.md`. 골드 타로 자산(`public/cards/back.png`·`axis/`·`domain/`)은 비교·회귀용으로 보존.

> 카드 180장을 개별 생성하지 않는다. **공통 뒷면 1 + 축 엠블럼 6 + 분야 아이콘 10 + 프레임/씨앗 2 = 약 19장**만 만들고,
> 앞면은 `배경틀 + 축 색 + 분야 아이콘 + 텍스트`를 CSS로 합성한다.
> 스타일 근거: `CLAUDE.local.md` Moonlight 토큰(다크+골드 인그레이빙, 블러 없는 하드 섀도) + **주 컬러=일렉트릭 애저 블루 `#4d8dff`**(토스 Simplicity의 파란 글로우 계열, 기존 퍼플 대체).
> 기법 근거: `.claude/knowledge/research/card-art-prompting/SUMMARY.md`(2026-07-06 리서치).

---

## ★ 제작 워크플로우 (일관성의 90%는 여기서 결정)

> 리서치 결론: **세트 통일감은 프롬프트가 아니라 "히어로 1장 확정 → 스타일 앵커로 재사용"이라는 절차에서 나온다.** 커뮤니티 78장 타로덱도 이 방식.

1. **뒷면(§1) 1장을 먼저 완성**해 "히어로"로 확정한다. 이게 전 세트의 스타일 기준.
2. 히어로를 **스타일 앵커로 재사용**해 축 6·분야 10을 뽑는다:
   - Midjourney → 프롬프트 끝에 `--sref <히어로 이미지 URL>`(또는 마음에 든 스타일코드). 참조는 **1~3개까지만**(많으면 스타일이 묽어짐).
   - Nano Banana Pro(Gemini 3 Pro Image) → 히어로를 **레퍼런스 이미지로 첨부**(최대 14장까지 동일성 유지 → 자산 세트에 현재 최강).
   - Flux/DALL·E 3 → 히어로를 레퍼런스로 첨부 + STYLE_BLOCK 자연어.
3. **한 세트는 한 세션에서 배치로** 생성(중간에 바꾸지 말 것). `--seed`·비율 고정, `--stylize`는 중간값.
4. 상위 10~20%만 큐레이션하고 **라인 미세 불일치는 수작업 보정 전제**(완전 자동 통일은 환상).

### 툴별 파라미터 요약

| 툴 | 스타일 고정 | 비율 | 비고 |
|---|---|---|---|
| Midjourney v8 | `--sref URL/코드` `--sw`(강도) `--seed N` | `--ar 3:5`(카드) / `1:1`(아이콘) | 짧고 강한 프롬프트 선호 |
| Nano Banana Pro | 레퍼런스 이미지 첨부(≤14) | 프롬프트에 "3:5 vertical" 명시 | 자연어 구조화 프롬프트, 자산 세트 1순위 |
| Flux | 레퍼런스 첨부 + 자연어 | 프롬프트에 명시 | 지시 준수도 최고, 키워드 스터핑 불필요 |
| **GPT Image 2.0** `gpt-image-2` | Thinking 모드 **세트 생성(최대 8장 일관)** / 레퍼런스 첨부(≤16) / **투명 PNG 네이티브** | 첫 문장에 `2:3 vertical` 또는 `1:1` 명시 | 축6·분야10을 **한 프롬프트로 통째** 생성 가능 → 세트 통일 최강 후보. §6 전용 레시피 참고 |

---

## 0. 공통 스타일 블록 (모든 프롬프트 끝에 붙일 것 — 일관성의 핵심)

> 아이콘/엠블럼 세트가 "한 손이 그린" 느낌이 나려면 **아래 문장을 토씨 하나 안 바꾸고** 모든 컷에 동일하게 붙이고, 가능하면 **같은 style reference(--sref) / 같은 seed**를 재사용한다.

**STYLE_BLOCK**
```
golden line engraving, thin uniform gold (#d9b25a) strokes on pure black (#000000) background,
celestial art-nouveau tarot aesthetic, crisp vector-like linework, perfectly centered and symmetrical,
single subject only, generous negative space, subtle electric azure blue (#4d8dff) glow accent,
NO blur, NO gradients on the lines, NO text, NO letters, NO numbers, NO drop shadow inside art,
flat 2D emblem, high contrast, engraving/etching feel
```

**전역 금지(네거티브)**: `text, words, letters, numbers, watermark, signature, photorealistic, 3D render, gradient mesh, busy background, multiple objects, clutter`

> **커뮤니티 검증 축약형** — 실제 MJ 타로덱에서 반복 사용되는 꼬리표. Midjourney처럼 짧은 프롬프트를 선호하는 툴엔 STYLE_BLOCK 대신 이 한 줄을 써도 된다:
> `Black paper with intricate and vibrant gold line work, decorated border, celestial tarot emblem --ar 3:5`

---

## 1. 공통 뒷면 (1장 · 최우선 · 브랜드 페이스)

- 용도: 플립 전에 모두가 보는 한 장. `reel-card.tsx`의 뒷면 `✦`를 대체.
- 비율: **300:485** (세로 카드 풀아트). 나머지 세트는 정사각 아이콘.

```
A mystical tarot card BACK design, vertical 300:485 ratio,
ornate golden border frame with art-nouveau corner filigree,
a single radiant celestial sigil at the exact center (four-point star / compass-rose motif),
faint symmetrical constellation pattern filling the field,
+ STYLE_BLOCK
```
- 후처리(코드): 히어로 글로우 `box-shadow:0 0 40px #4d8dff`, 하드 오프셋 섀도 `0 3px 0 #000`, `border-radius:20px`.

---

## 2. 축 엠블럼 (6장 · 이모지 👤😟🛠🎴📍🧠 대체)

> 정사각(1:1), 가운데 심볼 하나. 축마다 **틴트 1색**은 코드에서 입히니 프롬프트는 골드로 통일.

| 축 | 컨셉 | 프롬프트 주제(→ + STYLE_BLOCK) | 코드 틴트 |
|---|---|---|---|
| 누가 who | 사람·대상 | `a serene human silhouette bust inside a thin circle, gentle halo, tarot suit emblem` | 스카이블루 `#d8e9ff` |
| 고민 pain | 엉킨 마음 | `a single tangled thread knot forming a question-mark curl, a small thought-cloud above, tarot suit emblem` | 선택영역 `#ffd9cd` |
| 방법 how | 도구·해법 | `a crossed key and gear forming a balanced emblem, tarot suit motif` | 골드 `#d9b25a` |
| 모양 form | 그릇·형태 | `an ornate empty picture-frame / arched window as a vessel emblem, tarot suit motif` | 베이지 `#ecd8ce` |
| 장면 scene | 때·장소 | `a crescent moon and rising sun paired over a small location pin, time-and-place emblem` | 일렉트릭블루 `#4d8dff` |
| 마음 mind | 심리 습관 | `a heart orbited by a thin ring like a planet, small brain-gyrus flourish inside, psychology emblem` | 스카이블루 `#d8e9ff` |

---

## 3. 분야 아이콘 (10장 · 앞면 가운데 그림 · 데이터 `d:` 태그 = 재사용 열쇠)

> 정사각(1:1), 선 굵기·프레이밍 동일. **이 10개가 180장 카드의 앞면 그림을 전부 커버한다.**

| `d` | 뜻 | 프롬프트 주제(→ + STYLE_BLOCK) |
|---|---|---|
| learn | 배움 | `an open book with a small star rising from its pages` |
| work | 일 | `a checklist clipboard interlocked with a small gear` |
| image | 시각·이미지 | `an artist palette with a single brush, a subtle eye motif` |
| biz | 사업 | `a small storefront awning with an upward arrow above it` |
| content | 콘텐츠 | `a play-triangle inside a soft square, a small sound waveform beneath` |
| shop | 쇼핑 | `a shopping bag with a price tag, clean minimal` |
| money | 돈 | `a coin marked with the Korean won ₩ replaced by a plain circle, balanced on a tiny scale` |
| health | 건강 | `a heartbeat pulse line curving into a single leaf` |
| life | 생활 | `a cozy house silhouette with a small calendar page and a tea cup` |
| general | 범용 | `a four-point sparkle/twinkle inside a thin circle (default emblem)` |

> ⚠ `money` 프롬프트에 글자(₩)가 새 나올 수 있으니 **네거티브에 `text, letters, currency symbol` 유지**하고, 안 되면 "동전 위 별표"로 대체.

---

## 4. 공용 표면·프레임 (2장 · 선택)

**4-1. 앞면 프레임 (일반 카드 배경틀, 300:485)**
```
an empty vertical tarot card FRONT frame, 300:485, thin double golden border,
small corner ornaments, large empty center area, + STYLE_BLOCK
```
- 가운데를 비워 둬야 축 색·아이콘·텍스트가 올라간다.

**4-2. 씨앗("내 것") 골드 표면 (300:485)**
```
a luxurious brushed-gold card surface with faint engraved guilloché pattern,
warm champagne tone, subtle sheen, empty center, 300:485, + STYLE_BLOCK
(단, 배경을 검정 대신 gold로: replace "pure black (#000000) background" → "warm gold surface")
```
- 용도: `gold` 카드(사용자의 시작점)만 특별대우.

---

## 5. AI 생성 실무 팁 (일관성 깨지지 않게)

1. **한 세트는 한 세션에서 연속 생성** + 같은 `--sref`/seed. 뒷면 1장을 먼저 확정하고 그걸 스타일 기준으로 삼는다.
2. **아이콘 10 + 축 6은 정사각·투명 또는 순검정 배경**으로 뽑아 CSS에서 색·글로우를 입힌다(굽지 말 것).
3. **비율은 뒷면·프레임만 300:485**, 나머지는 1:1.
4. 텍스트가 자꾸 새면 네거티브 강화 + 후보정으로 지운다(엠블럼에 글자 0).
5. 먼저 **뒷면 1 + 축 6**(총 7장)만 뽑아 톤을 눈으로 확정한 뒤 분야 10을 이어서 — 스타일이 어긋나면 여기서 잡는다.
5-1. **멀티모델 교차**: 같은 프롬프트를 MJ·Flux·Nano Banana에 돌려 자산별로 가장 잘 나온 걸 채택(어느 모델이 이 스타일을 잘 그리는지는 실측이 답).
5-2. **큐레이션 전제**: 뽑은 것 중 상위 10~20%만 채택. 라인 굵기 미세 불일치는 벡터 보정(피그마/일러스트)로 마감 — 완전 자동 통일은 없다.
6. 산출물은 `public/cards/back.png`, `axis/{who…mind}.png`, `domain/{learn…general}.png` 정도로 배치 → `reel-card.tsx` 이모지 자리를 `<img>`로 교체.

---

## 6. GPT Image 2.0 (`gpt-image-2`) 전용 레시피 ★세트 통일 최강

> 2026-04 출시, `chatgpt-image-latest`. **왜 우리에게 최적인가**: ① **Thinking 모드가 한 프롬프트로 최대 8장을 같은 스타일로** 뽑음(축 6개를 통째로), ② **투명 PNG 네이티브**(CSS 틴트에 바로), ③ 레퍼런스 이미지 최대 16장으로 뒷면 스타일 락, ④ 앞부 단어가 시각 비중 최대라 **비율·스타일을 문장 맨 앞에**.
> ⚠ GPT Image 2.0의 간판 기능은 "글자 렌더링"인데 우리 엠블럼은 **글자 0**이 목표 → 그 강점은 버리고 네거티브로 글자를 강하게 눌러야 함. `input_fidelity`는 gpt-image-2에선 비활성(참고).

### 6-1. 뒷면 히어로 (Instant/Thinking · high · size `1024x1536`)
```
2:3 vertical tarot card BACK on pure black (#000000) paper.
A single radiant celestial four-point-star sigil centered exactly, rendered in thin luminous gold (#d9b25a) line engraving.
Details: ornate gold art-nouveau border frame with corner filigree; faint symmetrical constellation pattern filling the field; subtle electric azure blue (#4d8dff) glow around the center sigil.
Style: fine gold line engraving / etching, flat 2D, high contrast, celestial tarot aesthetic.
NO text, NO letters, NO numbers, NO watermark, NO photorealism, NO 3D, NO busy background.
```

### 6-2. 축 엠블럼 6개 — **한 프롬프트로 세트 생성** (Thinking 모드 · `1:1` · 투명)
> Thinking 모드로 "6장 세트"를 요청하면 6장이 **서로 일관된 스타일**로 나온다(개별 프롬프트 6번 X). 뒷면(6-1)을 레퍼런스로 첨부하면 더 강하게 락.
```
Generate a SET of 6 consistent emblem icons, one cohesive style, transparent PNG background, no background fill, 1:1 each.
SHARED STYLE (identical on all 6): thin uniform gold (#d9b25a) line engraving on transparent background, celestial art-nouveau tarot emblem, flat 2D, centered, symmetrical, single subject, crisp vector-like lines, identical stroke weight, subtle electric azure blue (#4d8dff) glow accent.
The 6 emblems:
1) WHO — a serene human bust silhouette inside a thin circle, gentle halo
2) PAIN — a single tangled thread knot curling into a question-mark, small thought-cloud above
3) HOW — a crossed key and gear forming a balanced emblem
4) FORM — an ornate empty arched window / picture-frame as a vessel
5) SCENE — a crescent moon and a rising sun paired over a small location pin
6) MIND — a heart orbited by a thin planetary ring, subtle brain-gyrus flourish inside
NO text, NO letters, NO numbers, NO watermark. Keep the same visual language across all six.
```

### 6-3. 분야 아이콘 10개 — **라벨 없는 5×2 그리드 1장** 후 슬라이스 (가장 균일)
> 공식 가이드가 "icon sets with consistent style"에 **그리드**를 콕 집어 추천. 10칸을 한 이미지로 뽑으면 선 굵기가 강제로 통일된다. 뽑은 뒤 피그마에서 10조각으로 자르고 개별 투명 PNG로.
```
1:1 grid, 5 columns × 2 rows = 10 cells, thin dividing guides only, pure black (#000000) background.
Each cell holds ONE gold (#d9b25a) line-engraving emblem, identical stroke weight and size, celestial tarot style, centered in its cell.
The 10 emblems, left-to-right, top-to-bottom:
1 an open book with a small star rising from its pages
2 a checklist clipboard interlocked with a small gear
3 an artist palette with a single brush and a subtle eye motif
4 a small storefront awning with an upward arrow above it
5 a play-triangle in a soft square with a small waveform beneath
6 a shopping bag with a price tag
7 a coin balanced on a tiny scale
8 a heartbeat pulse line curving into a single leaf
9 a cozy house silhouette with a small calendar page and a tea cup
10 a four-point sparkle inside a thin circle
NO text, NO letters, NO numbers, NO labels, NO watermark. Uniform line weight across every cell.
```
> 투명 배경 개별 컷이 필요하면: 그리드 대신 6-2 방식으로 **8개 세트 + 2개 세트**로 나눠 뽑고, 2번째 배치에 1번째 결과를 레퍼런스로 첨부해 톤을 잇는다.

### 6-4. GPT Image 2.0 실전 규칙 (필드가이드 + 공식 쿡북)
- **비율을 첫 문장에.** `2:3 vertical` / `1:1`. 프롬프트 순서 = `배경/장면 → 주제 → 디테일 → 제약`.
- **투명 배경**: `transparent PNG background, no background fill` 한 줄이면 컷아웃 없이 디자인 툴로 직행.
- **네거티브는 `NO X, NO Y`** 형식. 우리 필수: `NO text, NO letters, NO numbers, NO watermark`.
- **스타일 앵커는 구체적으로**("gold line engraving/etching" > "golden style"). `professional`보다 `editorial`이 더 높은 비주얼 레지스터를 침.
- **레퍼런스 락**: 편집/세트에서 `Image 1: 카드 뒷면 스타일. 이 스타일을 유지해 …` 식으로 **인덱스로 지목**.
- **드리프트 나면** 새 프롬프트 말고 "X만 바꾸고 나머지 유지" + preserve 리스트 반복.
- **품질/비용**: `quality` low($0.006)/medium($0.053)/high($0.211) per 1024². 초안은 low·medium, 최종만 high. API면 `n=4`로 한 번에 변형 4개.
- **접근 경로**: ChatGPT(Free 포함, 단 8장 세트·웹검색은 **Thinking 모드=Plus/Pro/Business**), `chatgpt.com/images`, API, 또는 Recraft/Figma/Adobe Firefly 통합.
```
