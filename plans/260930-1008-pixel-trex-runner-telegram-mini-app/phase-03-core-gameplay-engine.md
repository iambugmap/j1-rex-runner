# Phase 03 — Core Gameplay Engine

## Context Links
- [Plan](./plan.md) · [Phase 02](./phase-02-pixel-sprites-and-renderer.md)

## Overview
- Priority: P1 · Status: Pending · Effort: 4h
- Game loop, input, T-rex physics, obstacle spawning, collision, scoring, state machine (READY → RUNNING → CRASHED → RUNNING).

## Key Insights
- Fixed timestep (accumulator) → identical difficulty on 60/120Hz; clamp delta to 250ms after tab resume to avoid spiral.
- Keep game logic pure (no DOM) → unit-testable in Node. Only `main.ts` + renderer touch canvas/DOM.
- Chrome feel: variable jump (release early → cut velocity), fast-drop when duck pressed mid-air.

## Requirements
- Controls: Space/↑/tap = jump; ↓/swipe-down (or duck button) = duck; hold jump = higher jump; restart via same jump input after 500ms crash cooldown (prevents accidental restart).
- Obstacles: cactus groups (1–3 wide, bigger groups only at higher speed); pterodactyl after score ≥ 450 at 3 heights; min gap scales with speed; never spawn impossible combos (gap ≥ jump span at current speed).
- Score: `floor(distance * 0.025)`; high score compare on crash.

## Architecture
```
engine/fixed-timestep-game-loop.ts   start(update, render) / stop / pause / resume
engine/input-controller-keyboard-touch.ts  -> emits intent flags {jumpHeld, jumpPressed, duckHeld}
game/trex-player-physics.ts          y, vy, state(run|jump|duck|crash), anim frame
game/obstacle-spawner.ts             list<Obstacle>, spawn rules, uses injectable rng (testable)
game/hitbox-collision.ts             rectsOverlap, collides(playerFrame@pos, obstacleFrame@pos)
game/distance-score-tracker.ts       distance, score, milestone detection, high score
game/game-state-machine.ts           owns all above; update(dt, input) ; exposes read-only snapshot for renderer
game/game-scene-renderer.ts          draws snapshot (ground, obstacles, trex, HUD)
main.ts                              wire canvas sizing + loop + input + renderer
```
Data flow: Input → StateMachine.update(step) → snapshot → SceneRenderer.draw(ctx).

Physics constants (logical px, per 60Hz step): gravity 0.6, initial jump vy −10, drop vy −5 cut on early release, speedDropCoeff 3 when ducking in air, max jump height ~ 30px above min.

## Related Code Files
- Create: files listed in Architecture.
- Modify: `src/main.ts` (remove sprite debug grid).

## Implementation Steps
1. Loop: rAF + accumulator, `STEP = 1000/60`, max 5 steps/frame.
2. Input: keydown/keyup (prevent default on Space/arrows), `pointerdown/pointerup` on game container; swipe-down = pointer dy > 30px within 300ms → duck for 400ms or until release.
3. Physics + state machine; speed += ACCEL per step until MAX.
4. Spawner with seeded rng param; gap = `obstacleWidth * speed * GAP_COEF` random in [min, 1.5×min].
5. Collision: broad AABB first, then per-hitbox check (offset by positions).
6. Canvas sizing: fit width of container, logical 600×150, `scale = floor(min(cssW*dpr/600, ...))` ≥1; resize listener.
7. HUD: score + HI via pixel digits, top-right; blink score on milestone.
8. Crash: freeze, show crash frame + restart icon; cooldown 500ms.

## Todo List
- [ ] fixed-timestep loop
- [ ] input controller (keyboard + touch + swipe)
- [ ] trex physics
- [ ] obstacle spawner (seeded rng)
- [ ] collision
- [ ] score tracker
- [ ] state machine
- [ ] scene renderer + canvas sizing
- [ ] wire in main.ts
- [ ] unit tests: collision, spawner fairness, score, jump arc

## Success Criteria
- Playable end-to-end in desktop browser & mobile Chrome.
- Unit tests pass; no impossible obstacle patterns in 10k-step simulated run (test).

## Risk Assessment
- Difficulty tuning off → expose constants in one `game-balance-constants.ts` file.
- Touch double-fire (touch + mouse) → use Pointer Events only.

## Security Considerations
- N/A.

## Next Steps
- Phase 04 (visual polish/audio) & 05 (Telegram) in parallel.
