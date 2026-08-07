# Poly mobile frame audit

- Source: <https://poly.app/>
- Captured: 2026-08-03
- Viewport: 390 x 844
- Evidence: screenshots captured in this audit run only

## Overall verdict

Poly mobile is not a conventional long responsive page. The document stayed at `390 x 844` with `scrollHeight: 844`, while repeated vertical gestures advanced a fixed cinematic stage. The mobile version preserves the desktop story by cropping and recomposing the same 3D world, then uses the fixed bottom dock to jump between Discover, Showcase, and Features.

The strongest pattern is `stable product -> transformation -> input -> organized result`. The weakest part is the Features section, where the fixed top navigation and bottom dock compete with dense cards and sometimes cover transitional copy.

## Accepted flow

1. `01-mobile-hero.png` — Hero promise and product UI. Health: good.
2. `03-mobile-product-pivot.png` — Laptop becomes the shared object while copy recedes. Health: good.
3. `05-mobile-content-emerge.png` — Files burst from the product into the world. Health: mixed because blur and crop briefly reduce comprehension.
4. `07-mobile-discover-stage.png` — Scattered content frames a clear central promise. Health: good.
5. `09-mobile-search-query.png` — A fixed search bar exposes the user's input. Health: very good.
6. `14-mobile-final-results.png` — Irrelevant content leaves and matching files regroup around the query. Health: very good.
7. `22-mobile-showcase-selected.png` — One product capability occupies one screen. Health: good.
8. `26-mobile-features-cards.png` — Feature cards become a dense vertical list. Health: caution.
9. `32-mobile-end-stable.png` — The story returns to the opening physical world and ends with two actions. Health: good.

## Frame-by-frame mechanics

### 1. Promise before complexity

The first frame shows the product claim, two actions, and a laptop already running Poly. It does not begin with scattered files. The product is the stable starting object.

### 2. Product becomes a transition anchor

After the first gesture, the bottom dock appears. The laptop then pivots and moves away while the hero copy fades. This makes the scene change feel caused by the product instead of an unrelated section cut.

### 3. Content exits the product

Files appear only after the laptop has moved. Motion blur hides the difficult handoff frame, then the wood surface becomes the new stable background.

### 4. Disorder is shown around a calm center

Documents, images, and film frames occupy the edges. The center remains open for `Find your files naturally.` and later the search bar. The content is visually noisy, but the reading target is not.

### 5. Input stays fixed while the world changes

The search bar is the second stable anchor. The query is typed in place; unrelated files leave; matching files return around the same input. Cause and result remain visible in one frame.

### 6. One capability per Showcase frame

The mobile Showcase removes most environmental detail. A single product screenshot, one capability statement, and three use-case tags are shown on black. This is clearer than the dense Discover scene.

### 7. Features trade clarity for coverage

Features use large vertical cards, but fixed top and bottom navigation consume much of the 844px height. In transitional frames, headings and card descriptions touch or pass behind those controls. Small English copy also becomes difficult to read.

### 8. The ending closes the visual loop

The final frame returns to the physical desk and Poly object. The visual story closes where it began, while `Join waitlist` and `Join our discord` provide the final actions.

## Mobile-specific strengths

- Same world, clear anchors: laptop -> files -> search bar -> matching results.
- Portrait recomposition keeps important input and output near the center.
- Persistent dock makes three long chapters directly reachable.
- Large scene changes are separated by readable resting frames.
- The opening and ending use the same object and environment.

## Mobile-specific risks

- The page does not expose normal document scrolling in this capture. This is an inference from `scrollHeight === viewport height` and gesture-driven scene changes. Keyboard, screen-reader, and browser history behavior need separate testing.
- The fixed top navigation and bottom dock reduce the usable canvas and overlap dense Feature cards in several states.
- White text sometimes sits on bright wood or imagery with weak contrast.
- Transitional blur and off-screen movement can cause motion discomfort.
- Progress is communicated mostly by a small right rail and dock highlight; users may not know how many gestures remain.
- Reduced-motion behavior, VoiceOver/TalkBack order, real-device touch inertia, thermal load, and GPU performance were not verified.

## What Matpin should borrow

Use the causal structure, not Poly's entire interaction model.

1. Start with one stable reel card inside the mobile app frame.
2. On an explicit tap or horizontal swipe, hand the same card to `matpin.kr`.
3. Settle the same card as a smaller thumbnail inside `역삼역`.

For Matpin, three states are enough. Keep one bottom CTA, avoid simultaneous fixed top and bottom navigation, and do not intercept ordinary page scrolling on a mobile landing page. In a native-style onboarding, use page dots plus a visible `다음` action. Reduced motion should replace perspective and burst movement with a 160-220ms crossfade while preserving the same three results.

## Motion contract for Matpin

- Purpose: explain the unfamiliar save-and-group cause-and-effect.
- Frequency: first visit or an optional replay.
- Trigger: `다음`, page dot, or horizontal swipe.
- Stable anchor: the reel card.
- Handoff: reel card -> `matpin.kr` send node -> station thumbnail.
- Resting frames: every state must remain readable without motion.
- Reduced motion: no camera tilt, burst, or large travel; use opacity and a short scale change only.
