# Phase 04 — Scenery, Day/Night And Audio

## Context Links
- [Plan](./plan.md) · [Phase 03](./phase-03-core-gameplay-engine.md)

## Overview
- Priority: P2 · Status: Pending · Effort: 2h
- Parallax clouds + mountains, ground scroll, day/night cycle, WebAudio chiptune SFX.

## Key Insights
- Night = swap palette (ink↔paper) with ~1s crossfade; since sprites cached per color, prerender both palettes at startup to avoid hitch.
- Crossfade: render with interpolated bg color + draw sprites in both palettes w/ globalAlpha — or simpler: lerp only bg/paper, snap ink at 50% (KISS; good enough).
- WebAudio: `AudioContext` must be created/resumed inside user gesture (iOS WKWebView). Oscillator square wave blips, no audio files.

## Requirements
- Clouds speed 0.2× game speed, mountains 0.1×, ground 1×.
- Night every 700 pts, lasts until next 700 boundary (toggle).
- SFX: jump (short up-chirp), milestone (two-tone), crash (low buzz). Mute toggle persisted (localStorage).

## Architecture
```
game/parallax-scenery-layers.ts   update(speed), draw(ctx, palette)
game/day-night-cycle.ts           update(score, dt) -> t∈[0,1] night blend; currentPalette()
audio/webaudio-chiptune-sfx.ts    unlock(), play('jump'|'milestone'|'crash'), setMuted()
```
State machine emits events (`jump`, `milestone`, `crash`) → main.ts routes to audio (+ haptics in phase 05). Simple listener array, no event lib.

## Related Code Files
- Create: 3 files above.
- Modify: `game/game-state-machine.ts` (event emit), `game/game-scene-renderer.ts` (layers + palette), `src/main.ts` (wire audio, mute button).

## Implementation Steps
1. Add `onEvent(cb)` to state machine; emit on jump/milestone/crash.
2. Scenery layers with wraparound positions; randomized cloud spawn.
3. Day/night: toggle at `score % 700` crossings; lerp bg color via `mixHex(a,b,t)`.
4. Audio synth: `playTone(freq, dur, type='square', slideTo?)` w/ gain envelope to avoid clicks.
5. Unlock audio on first pointerdown/keydown.
6. Mute button in HUD area (DOM button, not canvas).

## Todo List
- [ ] event emitter in state machine
- [ ] parallax layers
- [ ] day/night cycle + color lerp
- [ ] WebAudio SFX + unlock
- [ ] mute toggle
- [ ] tests: day-night toggle thresholds, mixHex

## Success Criteria
- No frame drop on palette switch; sounds play on iOS Telegram after first tap.

## Risk Assessment
- iOS silent switch mutes WebAudio — acceptable, document.

## Security Considerations
- N/A.

## Next Steps
- Phase 06 tests/deploy.
