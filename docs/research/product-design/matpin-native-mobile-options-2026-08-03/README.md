# Matpin native mobile options

Generated with the built-in ImageGen tool on 2026-08-03.

## Product truth

- Input: share an Instagram reel to `matpin.kr`.
- Processing: extract place clues and group saved reels by station.
- Value moment: open one station and immediately browse its saved reels.

## Options

1. `01-result-first.png`: onboarding that proves the station-grouped result before asking the user to act.
2. `02-action-first.png`: onboarding that explains the cause-and-effect path from reel to station collection.
3. `03-library-home.png`: a functional post-onboarding home with station chips, reel grid, one send action, and compact navigation.

## Prompt set

- Option 1: a 390 x 844 native result-first onboarding screen, using the real station reel shelf as the hero, one short promise, and one bottom-safe Instagram send CTA.
- Option 2: a 390 x 844 native action-first onboarding screen, showing one reel moving through `matpin.kr` into an `역삼역` collection, with one Instagram-open CTA.
- Option 3: a 390 x 844 functional library home, with station chips, a two-column reel grid, one send action, and three compact bottom-navigation destinations.
- Shared constraints: graphite dark mode, Matpin coral only for active/primary states, no browser or device frame, no OS status bar, no marketing sections, no fake metrics, no scattered start state, no watermark.

## Mobile interaction rules

- One prominent action per screen.
- Primary controls are at least 48 dp; the onboarding CTA is 56 px high.
- Onboarding screens have no bottom navigation. The actual home uses bottom navigation for three main destinations.
- Korean headline line height should be at least 1.3; body text should be at least 1.5.
- Motion is causal: stable reel card -> send action -> station collection. Do not start with scattered cards.
- Reduced motion: replace card travel and tilt with a short crossfade between the three states.

## M3 evidence used

- Navigation bars are suited to compact handheld layouts: <https://m3.material.io/components/navigation-bar/guidelines> (captured locally 2026-07-10).
- Touch targets should be at least 48 x 48 dp: <https://m3.material.io/components/button-groups/accessibility> (captured locally 2026-07-10).
- App bars expose the current product/screen and relevant actions: <https://m3.material.io/components/app-bars/guidelines> (captured locally 2026-07-10).
- Floating action buttons communicate a prominent primary action: <https://m3.material.io/components/floating-action-button/guidelines> (captured locally 2026-07-10).

## Reference inputs

- Live Poly start-state audit: `../poly-live-start-audit-2026-08-03/01-hero.jpg`
- Matpin station result: `../matpin-poly-dark-digital-v3-2026-08-03/06-station.png`
- Matpin send state: `../matpin-poly-dark-digital-v3-2026-08-03/02-send.png`
