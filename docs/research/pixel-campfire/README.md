# Pixel Campfire Reference

## Purpose

This folder is the fidelity contract for the campfire artwork. Do not redraw it from memory. Read the JSON and compare against the analysis page before editing the product flow.

## Source facts

- Pixel size: **4px**
- Static pixels: **2394**
- Animated-frame pixels: **3013**
- Total recorded coordinates: **5407**
- Bounds: **0,0 → 496,252**
- Animation: **500ms steps(1,end)**
- Frames: **0, 50, 100, 16.666666666666668, 33.333333333333336, 66.66666666666667, 83.33333333333334**

## Layer contract

- `character_and_armor`: 1750 pixels
- `flame`: 1302 pixels
- `wooden_chair`: 709 pixels
- `logs`: 691 pixels
- `sparks`: 682 pixels
- `ambient_pixels`: 115 pixels
- `ground_shadow`: 91 pixels
- `ground_light`: 67 pixels

## Non-negotiable implementation rules

1. Preserve the 4px grid or an integer multiple of it.
2. Never replace the artwork with gradients, blur-built shapes, smooth SVG paths, or a generic flame icon.
3. Ground light and ground shadow are required layers, not decoration.
4. Animate by switching pixel frames with `steps(1,end)`; do not approximate with smooth scale or sway.
5. Keep logs, flame, sparks, ground light, chairs, ghosts, and people independently addressable.
6. Removing a character must be done by layer, never by cutting a rectangular coordinate region.
7. A golden render must be reviewed at 1x and nearest-neighbour 4x before merging.
8. Palette changes may remap colors, but coordinates and layer membership stay stable unless the golden render is updated.

## Required golden states

- empty: four chairs and four floating ghosts
- one-supporter: one seated person and three floating ghosts
- full: four seated people and no ghosts
- fading: small flame plus all three dotted flame-size guides
