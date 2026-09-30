# Phase 02 — Pixel Sprites And Renderer

## Context Links
- [Plan](./plan.md) · Style ref: Claude Code mascot (flat blocky, square eye cutouts, stub legs) — style only, original designs.

## Overview
- Priority: P1 · Status: Pending · Effort: 3h
- Define all sprites as char matrices; build renderer that prerenders matrices to offscreen canvases, cached per palette.

## Key Insights
- Flat single-color silhouettes + transparent "cutout" pixels for eyes = the target style. One ink color per sprite → recolor for night mode trivially.
- Prerender once (per sprite × frame × palette) → `drawImage` per frame, cheap.
- Hitboxes live alongside sprite frames (same file) so art + collision stay in sync.

## Requirements
- Sprites: T-rex (run×2, jump, duck×2, crash), cactus (small, large, and grouped via repeat), pterodactyl (flap×2), cloud, mountain, ground sprite/pebbles, digits 0-9 + "HI" for HUD, "GAME OVER" text optional (can use canvas font fallback — YAGNI: use pixel digits only, draw GAME OVER via same 3×5 font if cheap).
- Matrix format: `'#'` = ink, `'.'` = transparent. Optional `'o'` = secondary color (reserved, YAGNI unless needed).

## Architecture
```ts
// engine/pixel-sprite-renderer.ts
export interface SpriteFrame { rows: readonly string[]; hitboxes: readonly Rect[] }
export interface Rect { x: number; y: number; w: number; h: number }
export function spriteSize(f: SpriteFrame): { w: number; h: number }
export function prerenderSprite(f: SpriteFrame, color: string): HTMLCanvasElement // cached by key
export function drawSprite(ctx, f, x, y, color): void
```
- Cache: `Map<SpriteFrame, Map<color, HTMLCanvasElement>>` (WeakMap on frame object).
- Draw at logical px; main canvas uses `ctx.setTransform(scale,0,0,scale,0,0)` + `imageSmoothingEnabled=false`.

Concept T-rex (≈20×22 logical, refine in impl):
```
..........##########
..........##..######
..........##########
..........######....
....##....########..
....##############..
......############..
........##....##....
........##....##....
```

## Related Code Files
- Create: `src/engine/pixel-sprite-renderer.ts`, `src/sprites/trex-sprite-frames.ts`, `src/sprites/cactus-sprite-variants.ts`, `src/sprites/pterodactyl-sprite-frames.ts`, `src/sprites/background-scenery-sprites.ts`, `src/sprites/pixel-font-digits.ts`, `src/game/palette-colors.ts`

## Implementation Steps
1. `palette-colors.ts`: `DAY = { ink:'#1F2A44', paper:'#F5EFE0', faint:'#C9C2B0' }`, `NIGHT` = inverted.
2. Renderer: parse rows once, validate equal row length (throw in dev), fill 1×1 rects on offscreen canvas.
3. Draw sprites; keep each file < 200 LOC. Design rules: chunky 2-px minimum features, eyes = 2×2 transparent hole, legs = 2-px wide stubs, no outlines/anti-aliasing.
4. Hitboxes: 2–4 rects per frame, inset ~1–2px from silhouette edges (fairness).
5. Temporary debug page state in `main.ts`: draw all sprites in a grid to eyeball; remove after.
6. Unit test: every frame's rows equal length; hitboxes inside sprite bounds.

## Todo List
- [ ] palette constants
- [ ] renderer + cache
- [ ] T-rex frames + hitboxes
- [ ] cactus variants + hitboxes
- [ ] pterodactyl frames + hitboxes
- [ ] cloud/mountain/ground
- [ ] pixel digits font
- [ ] sprite integrity tests

## Success Criteria
- All sprites render crisp at scale 2–4 on retina; night palette recolors correctly.
- Visual review: style reads as "blocky Claude-Code-like", not a copy of mascot.

## Risk Assessment
- Art iteration time-sink → timebox; ship v1 silhouettes, polish later.

## Security Considerations
- N/A (static assets in code).

## Next Steps
- Phase 03 consumes `SpriteFrame` + hitboxes.
