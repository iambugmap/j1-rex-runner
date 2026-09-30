# Brainstorm: Pixel T-rex Runner — Telegram Mini App

Date: 2026-09-30 | Status: design approved

## Problem / Requirements
- Chrome-offline-style endless runner: T-rex main char; obstacles cactus + pterodactyl.
- Pixel art in *style* of Claude Code mascot (flat blocky, square eye cutouts, stub legs) — original sprites, no copy.
- Score grows with distance.
- Runs as Telegram Mini App.

## Decisions (user-confirmed)
| Topic | Choice |
|---|---|
| Telegram scope | Static Mini App, no backend. High score via `CloudStorage`, `localStorage` fallback |
| Stack | Vite + TypeScript + Canvas 2D, no engine (~15KB) |
| Art | Pixel matrices in code → prerendered offscreen canvas per color |
| Palette | Navy (~#1F2A44) on cream (~#F5EFE0); night = inverted |
| Layout | Portrait, horizontal game strip (600×150 logical) centered; score/HUD above |
| MVP features | Core Chrome gameplay, day/night cycle, WebAudio 8-bit SFX, parallax clouds/mountains |
| Hosting | GitHub Pages via GitHub Actions |

## Approaches evaluated
- **Telegram**: static Mini App (chosen: zero infra) vs Mini App + leaderboard (needs backend, HMAC initData validation, cheatable) vs Telegram Game API (built-in per-chat leaderboard, needs bot server). Leaderboard deferred.
- **Stack**: Canvas vanilla TS (chosen) vs Phaser (~1MB, overkill) vs single-file JS (no types, hard to extend).
- **Art**: code matrices (chosen: crisp, recolorable, no tooling) vs PNG sprite sheets (tool + export loop).
- **Orientation**: portrait strip (chosen: works on all clients) vs fullscreen landscape (Bot API 8.0+ only).

## Final design
### Gameplay (mirror Chrome constants)
- Speed start 6 → max 13, gradual accel; score from distance.
- Pterodactyl only after ~450 pts, 3 heights.
- Cactus: 3 sizes, groups of 1–3.
- Multi-hitbox collision per sprite (fair, no phantom hits).
- Day/night toggle every 700 pts (~1s fade); milestone SFX every 100.
- Fixed-timestep 60Hz update → consistent speed on 60/120Hz screens.

### Controls
- Tap / Space / ↑ = jump (hold = higher). Swipe down / ↓ = duck.
- Risk: vertical swipe closes Mini App → `disableVerticalSwipes()` (Bot API 7.7+); fallback on-screen duck button.

### Telegram bridge
- `ready()`, `expand()`, `disableVerticalSwipes()`, safe-area insets.
- Haptics on crash/milestone. Pause on `deactivated` / `visibilitychange`.
- WebAudio unlocked on first tap (iOS).

### Structure (files <200 LOC)
```
src/
  main.ts
  engine/  fixed-timestep-game-loop.ts, input-controller-keyboard-touch.ts, pixel-sprite-renderer.ts
  sprites/ trex-sprite-frames.ts, cactus-sprite-variants.ts, pterodactyl-sprite-frames.ts, background-scenery-sprites.ts
  game/    game-state-machine.ts, trex-player-physics.ts, obstacle-spawner.ts, hitbox-collision.ts, distance-score-tracker.ts, day-night-cycle.ts
  audio/   webaudio-chiptune-sfx.ts
  telegram/telegram-webapp-bridge.ts
.github/workflows/deploy-github-pages.yml
```

## Risks
- Swipe-down conflict with Telegram close gesture (mitigated above).
- iOS webview audio autoplay restrictions → unlock on first gesture.
- High-refresh screens → fixed timestep.
- Trademark: don't use "Claude" name/logo; style inspiration only.
- GitHub Pages `base` path must match repo name.

## Success criteria
- 60fps stable on mid-range Android in Telegram webview.
- Bundle < 50KB gzipped; first paint < 1s.
- Controls work: keyboard (desktop), tap + swipe (mobile Telegram).
- High score persists across sessions/devices (CloudStorage).
- Unit tests (Vitest) for collision, spawner, scoring, jump physics.

## Out of scope (MVP)
Leaderboard, backend, anti-cheat, skins, in-game currency. Future leaderboard → Telegram Game API.

## Next steps
1. `/ck:plan` → phased implementation plan.
2. Create GitHub repo; register bot + Mini App via BotFather.

## Unresolved questions
- Game name/title (avoid "Claude")?
- GitHub repo name (affects Vite `base` path)?
- Exact navy/cream hex values — finalize during sprite phase.
