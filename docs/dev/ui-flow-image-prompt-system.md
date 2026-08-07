# UI 플로우 이미지 프롬프트 시스템

> 목적: 앱 하나의 핵심 여정을 **스마트폰 목업 5장이 나란히 놓인 가로 이미지 한 장**으로 뽑는 프롬프트를, 앱이 바뀌어도 같은 디자인 시스템으로 반복 생성하기 위한 지시서.
> 원본: `bac1af7c` 세션(2026-07-12)에서 확정한 5개 앱(맛핀·한입코치·곁불·오늘의 이세카이·마음수호신) 통일 프롬프트.
> 쓰는 법: 아래 **시스템 프롬프트**를 새 대화 맨 앞에 붙여넣고, 그다음에 앱 정보(입력 슬롯)만 던진다.

---

## 1. 시스템 프롬프트 (그대로 복사)

```text
You are a UI flow image-prompt generator for Korean mobile apps.

Your only job: given one app's information, output ONE English image-generation prompt
that renders a single wide image of five smartphone mockups side by side — the app's
core user journey, left to right, in the order given.

## Non-negotiable design system (never change, never omit)

Every prompt you write MUST contain this block verbatim, only swapping the accent line:

  A single wide image showing 5 identical modern smartphone mockups side by side, each a
  real mobile app UI screen, connected by thin arrows with Korean step labels.
  DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black
  cards with 20px rounded corners and subtle borders, one bold vertical gradient accent
  color, large friendly Korean sans-serif headlines (Pretendard style), full-width
  pill-shaped CTA button at bottom of each screen, minimal icons, soft glow on accent
  elements, Gen-Z Korean app aesthetic like Korean character-chat apps (Zeta/Crack) and
  Gas app. Accent color: <ACCENT>.

Then five screen sentences, then the closing constraint line:

  Landscape 16:9, numbered badges 1-5, no real people, no watermark.

## Screen sentence format

One sentence per screen, in this exact shape:

  Screen N '<한글 단계 라벨>': <what is literally on the screen, in English>.

Rules for screen sentences:
- Describe REAL UI: input fields, cards, chips, bottom sheets, list rows, toggles,
  sliders, badges, CTA buttons. Not moods, not metaphors.
- Every on-screen Korean word (labels, CTA text, counters) stays in Korean inside
  single quotes. Never translate UI copy to English.
- Name the interaction pattern when it carries the product idea
  (Tinder-style card, bottom sheet, chat bubble, breathing timer, shareable card).
- Screen 5 should end on the retention or share or payment moment when the app has one.
- Absence is a feature: if a screen deliberately lacks something, say so explicitly
  (e.g. "NO chat input field at all").

## Optional ATMOSPHERE RULE

Default is flat UI everywhere. Only if the app has one or two genuine hero moments
(the screen users capture and share), insert after the accent line:

  ATMOSPHERE RULE: screens <flat list> stay strictly clean flat UI; screens <hero list>
  are the hero moments and may be moody and slightly conceptual — a beautiful painterly
  illustration is allowed INSIDE the main card with a soft glow bleeding slightly beyond
  the card edge, but UI text and buttons stay crisp and readable.

Never allow full-screen concept art. Illustration lives inside a card, never behind the
whole screen. UI is the protagonist; art is a thumbnail.

## Mascot

If the app has a mascot or persona, add one sentence right after the accent line
describing it, ending with "appears consistently" so it repeats across panels.

## Output format

- Output the prompt in a single fenced code block, nothing else before or after it,
  unless the user asks for commentary.
- The prompt is ONE English paragraph, no line breaks, no bullet lists, no headings.
- Never include: real people or celebrities, brand logos, watermarks, English UI copy,
  app store frames, hands holding the phone, 3D perspective tilt, drop-shadow collage.
- If the user gives fewer than 5 steps, ask which step to split; do not invent a step
  that changes the product's meaning.

## Consistency across apps

When more than one app is requested, remind the user once: generate app 01 first, then
attach that image for every later app and append "same design system as attached".
Do not silently vary corner radius, background, or CTA shape between apps — only the
accent color, the mascot, and the five screens change.
```

---

## 2. 입력 슬롯 (사용자가 채워서 던지는 부분)

```text
앱 이름:
파일명:
액센트: <색 A>-to-<색 B> gradient   ← 앱의 감정 축을 색으로. 예: warm amber-to-deep orange (firelight)
마스코트: (없으면 없음)
히어로 화면: (없으면 없음 / 있으면 번호 1~2개)
5단계:
1. <한글 라벨> — 화면에 뭐가 있나
2. …
3. …
4. …
5. <리텐션·공유·결제 순간>
```

## 3. 액센트 컬러 대장 (이미 쓴 것)

| 앱 | 액센트 | 히어로 |
|---|---|---|
| 맛핀 | tomato red-to-orange | 없음 |
| 한입코치 | coral red-to-hot pink | 없음 (마스코트: 호루라기 문 코치) |
| 곁불 | warm amber-to-deep orange (firelight) | 없음 |
| 오늘의 이세카이 | violet-to-teal | 1(문), 4(결말 카드) |
| 마음수호신 | lavender-to-warm gold | 없음 (마스코트: 여우 수호신) |

새 앱은 위와 겹치지 않는 색을 고른다. 색이 겹치면 5장을 나란히 놨을 때 앱 구분이 죽는다.

## 4. 검수 체크리스트

- [ ] 디자인 시스템 블록이 글자 그대로 들어갔나 (액센트만 교체)
- [ ] 한글 UI 문구가 영어로 번역되지 않았나
- [ ] 화면마다 실제 UI 요소가 최소 2개씩 명시됐나
- [ ] 5번 화면이 리텐션·공유·결제 중 하나로 끝나나
- [ ] 히어로 지정이 2장을 넘지 않나
- [ ] 마지막 줄 `Landscape 16:9, numbered badges 1-5, no real people, no watermark.` 가 있나

## 5. 부록 — 확정본 5종 전문

04 오늘의 이세카이는 **균형판**(1·4만 히어로 허용)이 최종이다. 판타지를 카드 썸네일 한 칸으로만
격리한 **절제판**도 `bac1af7c` 세션에 남아 있다.

### 01 맛핀 (`matpin-flow.png`)

```text
A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, one bold vertical gradient accent color, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal icons, soft glow on accent elements, Gen-Z Korean app aesthetic like Korean character-chat apps (Zeta/Crack) and Gas app. Accent color: tomato red-to-orange gradient. Screen 1 '붙여넣기': a single input field with a pasted video link thumbnail, big CTA '핀 꽂기'. Screen 2 '추출': a Tinder-style card showing extracted restaurant name, menu, distance, with confidence chips. Screen 3 '내 지도': dark map view with glowing red pins clustered. Screen 4 '오늘 갈 곳': one pin expanded into a bottom sheet with photo, menu, '길찾기' pill button. Screen 5 '동선': pins connected by a glowing route line, save CTA. Landscape 16:9, numbered badges 1-5, no real people, no watermark.
```

### 02 한입코치 (`hanip-flow.png`)

```text
A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, one bold vertical gradient accent color, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal icons, soft glow on accent elements, Gen-Z Korean app aesthetic like Korean character-chat apps (Zeta/Crack) and Gas app. Accent color: coral red-to-hot pink gradient. A small tough-coach mascot avatar (whistle, smirk) appears consistently in the chat header. Screen 1 '사진 제출': camera view framing fried chicken, big CTA '코치에게 보내기'. Screen 2 '음식 확인': AI-detected food chips with confidence percentages, tap-to-confirm. Screen 3 '팩폭': chat bubble from the coach highlighted in gradient '야근은 핑계고, 치킨은 진심이네요', below it a calm fact line. Screen 4 '다음 한입': one action card '다음 끼니: 채소 먼저' with a big checkbox, CTA '약속하기'. Screen 5 '팩폭 카드': a shareable vertical card '오늘의 팩폭' with the quote and button '나도 혼나볼래'. Landscape 16:9, numbered badges 1-5, no real people, no watermark.
```

### 03 곁불 (`gyeotbul-flow.png`)

```text
A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, one bold vertical gradient accent color, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal icons, soft glow on accent elements, Gen-Z Korean app aesthetic like Korean character-chat apps (Zeta/Crack) and Gas app. Accent color: warm amber-to-deep orange gradient (firelight). Screen 1 '초대': a single contact card with one close friend and CTA '모닥불에 초대'. Screen 2 '동시 접속': a private bonfire scene card, two small avatar dots glowing on both sides, label '둘 다 접속 중'. Screen 3 '함께': the bonfire burning, NO chat input field at all, only two soft presence indicators and ambient sound toggle. Screen 4 '장작': a shared log being placed by two hands, flame grows, haptic ripple effect. Screen 5 '다음 불': a minimal schedule card '내일 밤 11시' with CTA '다음 불 예약'. Landscape 16:9, numbered badges 1-5, no real people, no watermark.
```

### 04 오늘의 이세카이 — 균형판 (`oneul-isekai-flow.png`)

```text
A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal flat icons, clean flat UI like a real Korean chat app (Zeta/Crack). Accent color: violet-to-teal gradient, used on buttons, chips and highlights. ATMOSPHERE RULE: screens 2, 3, 5 stay strictly clean flat UI; screens 1 and 4 are the hero moments and may be moody and slightly conceptual — a beautiful painterly illustration is allowed INSIDE the main card with a soft glow bleeding slightly beyond the card edge, but UI text and buttons stay crisp and readable. Screen 1 '오늘의 문' (hero): a full-bleed card with an atmospheric glowing gate illustration in twilight mist, world title '무너진 도서관', countdown '23:41 남음', CTA '입장하기'. Screen 2 '모험': standard chat UI, AI narration bubbles and user reply input, one small scene thumbnail pinned at top. Screen 3 '판정': a simple bottom-sheet modal with a d20 icon, text '판정 성공' and a chip '어제의 스킬 +2' with a subtle glow. Screen 4 '결말 카드' (hero): a shareable vertical card with a small atmospheric scene illustration, 생환 badge, '11턴', relic name with icon, a title line in serif type, CTA '카드 공유'. Screen 5 '상태창': plain list UI of skills with level chips, below a horizontal row of small world thumbnails, one dimmed with a lock icon labeled '닫힌 문'. Landscape 16:9, numbered badges 1-5, no real people, no watermark.
```

### 05 마음수호신 (`maeum-flow.png`)

```text
A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, one bold vertical gradient accent color, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal icons, soft glow on accent elements, Gen-Z Korean app aesthetic like Korean character-chat apps (Zeta/Crack) and Gas app. Accent color: lavender-to-warm gold gradient. A small cute fox-like guardian spirit mascot appears consistently. Screen 1 '수호동물': birthdate input and a reveal card showing my guardian animal with element tag '화(火)', CTA '만나기'. Screen 2 '걱정 맡기기': one-line worry input field and an intensity slider 0-10, CTA '맡기기'. Screen 3 '90초 의식': the guardian holding the worry as a paper slip floating into a lantern, a breathing circle timer, no chat input. Screen 4 '내려놓기': dimmed peaceful screen, intensity re-check slider showing 7→5, CTA '오늘은 여기까지'. Screen 5 '정원': a quiet garden view with 7 day-trace stones and a preview card '내 마음 사용설명서' with price chip '3,900원'. Landscape 16:9, numbered badges 1-5, no real people, no watermark.
```
