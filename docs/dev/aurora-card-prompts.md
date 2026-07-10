# 오늘 해볼까 — 오로라 카드 스틸컷 프롬프트 설계 (v2.1 · 풀블리드 · GPT2 구조화)

> 골드 타로(v1, `docs/card-art-prompts.md`)를 대체하는 **완전 피벗**. 토스뱅크 공채 키비주얼 방향.
> 확정 요구: **심플 · 카드 비율(2:3) 풀블리드 · 직각 모서리 · 카드마다 명확히 다른 컨셉.**
> v2.1: gpt-image-2 공식 구조 문법으로 재설계 — 근거: [`docs/research/card-art-prompting/GPT2-PROMPT-STRUCTURE.md`](../research/card-art-prompting/GPT2-PROMPT-STRUCTURE.md).
> 스틸 먼저 → Veo 모션은 각 카드의 "빛의 동사"를 이어받아 후속(§5).

## 0. 설계 원리 — 색이 아니라 "빛의 동사"로 구분한다

색만 바꾸면 같은 그림 N장이 된다(1차 실패 교훈). 카드마다 **빛이 하는 행동 1개**를 배정하고,
그 행동이 구도를 결정한다. 총 12장: 카테고리 6 + 축 5 + 뒷면 1.

| 동사 | 구도가 되는 방식 | 배정 |
|---|---|---|
| 솟다 rise | 아래→위 가파른 대각 광선 | fitness |
| 피다 bloom | 중심에서 동심원으로 번짐 | food |
| 흐르다 flow | 가로 리본 밴드의 리듬 | content |
| 맺히다 structure | 각진 빛 평면·파셋 | dev |
| 모이다 converge | 여러 흐름이 한 점으로 | commerce |
| 퍼지다 radiate | 한 점에서 밖으로 방사 | marketing |
| 깨어나다 emerge | 어둠 바닥에서 첫 빛 | 축 seed |
| 맞서다 clash | 두 색면의 팽팽한 경계 | 축 pain |
| 정돈되다 settle | 빛이 층층이 정렬 | 축 format |
| 물들다 drift | 수평 지평선의 시간대 빛 | 축 situation |
| 고동치다 pulse | 겹겹의 halo가 숨 쉼 | 축 psych |
| 잠들다 slumber | 근검정 속 희미한 숨결 | 뒷면 |

## 1. 구조화 프롬프트 템플릿 (gpt-image-2 공식 문법)

> 리서치 결론: 전문가 프롬프트 = **라벨 필드 + 고정 순서**. 비율은 맨 앞, Use case가 모델의 '모드'를 세팅,
> Constraints는 매 호출 토씨 불변으로 반복(통일성 담당). 카드마다 **Subject/Composition/Palette 3필드만** 바뀐다.
> 스타일 형용사 나열 금지 — "그릴 수 있는 것"만 쓴다(*"Excitement does not render"*).

```
Vertical 2:3, 1024x1536, full-bleed.

Use case: premium fintech keyvisual — card surface art for a dark glassmorphism app.

Subject: [빛의 동사 1개 — 이 카드의 유일한 focal 행동]
Composition: [빛의 시작점 → 흐름 방향 → 프레임을 네 모서리까지 채우는 방식]
Palette: [주색 hex → 보조색 hex, 가장자리 깊이 톤]

Light quality: silky smooth gradients, soft volumetric glow, clean and minimal, abstract light only.
Constraints: the light field fills the ENTIRE frame edge-to-edge and corner-to-corner; sharp rectangular corners.
NO rounded corners, NO squircle, NO floating tile, NO border, NO margin, NO frame,
NO text, NO letters, NO numbers, NO icons, NO objects, NO scenery, NO watermark, NO busy detail.
```

- Palette에는 **앱 실토큰**(globals.css aurora: `#2dffa0` `#22d3ee` `#3a63ff` `#1a2fb5`)을 우선 사용 — 구체가 이기고, UI와 한 몸이 된다.
- 텍스트 가독성은 아트에 굽지 말고 **CSS 스크림**(하단 `linear-gradient(transparent, rgba(0,0,0,.45))`)으로.

## 2. 카테고리 6장 — `public/cards/aurora/category/`

**fitness.png** · Veo: slow upward surge, seamless loop
```
Subject: light SURGING upward — one steep kinetic acceleration.
Composition: beams originate at the bottom edge, rush diagonally toward the upper corners with stretching motion trails; the surge fills all four corners.
Palette: emerald green (#2dffa0) flowing into cyan (#22d3ee), deepening to dark teal at the far edges.
```

**food.png** · Veo: breathing bloom, seamless loop
```
Subject: warm light BLOOMING — one soft breathing radiance.
Composition: concentric waves expand from a gentle heart slightly below center, organic roundness reaching every corner.
Palette: coral (#ff6b4a) melting into amber (#ffb454), deepening to warm umber at the edges.
```

**content.png** · Veo: lateral drift, seamless loop
```
Subject: light FLOWING sideways — one rhythmic lateral current.
Composition: layered horizontal ribbons cross the frame like silent waveforms, stacked bands filling from top edge to bottom edge.
Palette: magenta (#ff2d95) streaming into hot pink (#ff7ac8), deepening to dark plum at the edges.
```

**dev.png** · Veo: slow parallax of planes
```
Subject: light CRYSTALLIZING into structure — one precise geometric stillness.
Composition: crisp angular light planes intersect with faceted refraction, engineered order filling the frame corner-to-corner.
Palette: electric blue (#3a63ff) cut with deep indigo (#1a2fb5), near-black blue at the edges.
```

**commerce.png** · Veo: streams flowing inward
```
Subject: light CONVERGING — one inward pull of many currents.
Composition: luminous streams flow in from all four edges and meet at a bright node just above center.
Palette: amber gold (#ffc24d) merging into warm magenta (#e0559a), deepening toward the edges.
```

**marketing.png** · Veo: outward radial expand
```
Subject: light RADIATING outward — one expanding broadcast.
Composition: a radial burst opens from a low origin point, rays widening until they exit through every corner.
Palette: violet (#7a3bff) brightening into purple glow (#b26bff), deep violet-black at the edges.
```

## 3. 축 5장 — `public/cards/aurora/axis/` (라이브 AxisId 일치)

**seed.png** (씨앗 — UI 골드 칸) · Veo: dawn glow rising
```
Subject: first light EMERGING — one quiet awakening.
Composition: deep darkness fills most of the frame; a single soft glow rises from the bottom edge like dawn.
Palette: champagne gold (#e8c87a) breathing out of near-black (#0a0a0b).
```

**pain.png** (불편) · Veo: seam slowly shifting
```
Subject: two lights MEETING — one taut seam of tension.
Composition: two color fields press against each other along a luminous diagonal boundary, elegant discord, each field reaching its own corners.
Palette: deep crimson (#d43a3a) against dark ember (#6e1f14).
```

**format.png** (형태) · Veo: planes settling into place
```
Subject: light SETTLING into order — one calm resolution.
Composition: soft horizontal planes stack and align, loose haze at the top resolving into ordered layers at the bottom.
Palette: turquoise (#2dd4bf) resolving into teal (#0d9488), deep sea tone at the edges.
```

**situation.png** (장면) · Veo: horizon light turning
```
Subject: dusk light TURNING — one horizon of time.
Composition: a serene horizontal horizon band glows across the middle; sky above, afterglow below, both stretching to the corners.
Palette: sky blue (#7ab8ff) melting into warm peach (#ffd0a8).
```

**psych.png** (마음) · Veo: halos breathing
```
Subject: light PULSING — one slow heartbeat.
Composition: nested translucent halos breathe outward from the center, each ring fainter until it dissolves at the corners.
Palette: pearl white (#f5f0ff) into pale lavender (#cdb8ff), dim violet-grey at the edges.
```

## 4. 뒷면 1장 — `public/cards/aurora/back.png` · Veo: dormant breath

```
Subject: light SLUMBERING — one dormant breath.
Composition: an almost-black field; a faint aurora whisper drifts deep in the darkness, barely visible, waiting to be revealed.
Palette: near-black (#0a0a0b) with a whisper of deep indigo (#0f1a6e) and dark emerald.
```
- 덱 56장 공용. 축 힌트는 이미지에 굽지 않고 **컴포넌트에서 오버레이**(다른 세션 소유 파일이므로 연결은 조율).

## 5. Veo 모션 후속 (스틸 확정 뒤 · 별도 승인)

- 키: `.env`의 `ALLSALE_GEMINI_API_KEY` (`gemini` CLI·`google-genai` py 설치 확인됨).
- 방식: **각 스틸을 first frame으로** Veo image-to-video. 프롬프트 = `카드별 Veo 동사 + "seamless loop, 4s, subtle, no new elements"`.
- 스틸의 동사와 모션의 동사가 같아서 정지↔모션이 한 시스템으로 유지된다.

## 6. 생성 실무 (실행은 승인 후)

1. **1장 = 1호출**로 개별 생성 — 세트 호출은 구도가 서로 닮아지며 평균화됨(1차 실패 원인). 구분은 Subject/Composition이, 통일은 불변 블록(Use case·Light quality·Constraints)이 담당.
2. codex 패턴(포그라운드, `-i` 뒤엔 반드시 `-o`로 끊기 — [[codex-image-generation]]):
   ```
   codex exec -s workspace-write --skip-git-repo-check -C <repo> \
     -c sandbox_workspace_write.network_access=true \
     -o <lastmsg.txt> "…IMAGE PROMPT: <§1 템플릿 + 카드별 3필드>" < /dev/null
   ```
3. 품질/비용: 초안 `quality=low/medium`으로 구도 확인 → 최종만 `high`. API 직행 시 `n=4` 변형 비교.
4. 검증: 콘택트 시트에서 ① 썸네일 크기에서도 서로 구분되는가 ② 모서리 4곳까지 색이 닿는가(직각) ③ 글자·아이콘 유입 없는가.
5. 순서: 카테고리 6 → 콘택트 검증 → 축 5 → 뒷면 1 → `lib/card-art.ts` 경로를 aurora로 갱신.
6. 골드 타로 v1 자산(`public/cards/back.png`, `axis/`, `domain/`)은 삭제하지 말고 아카이브(비교·회귀용).
