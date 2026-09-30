---
title: "J1 Rex Runner Telegram Mini App"
description: "Chrome-offline-style endless runner with Claude-Code-style pixel art, shipped as static Telegram Mini App on GitHub Pages."
status: pending
priority: P1
effort: 14h
branch: main
tags: [frontend, game, canvas, telegram, typescript]
blockedBy: []
blocks: []
created: 2026-09-30
---

# J1 Rex Runner Telegram Mini App

## Overview

Endless runner (Chrome dino clone mechanics) in Vite + TS + Canvas 2D, no engine. Original pixel sprites in flat blocky style (navy on cream), defined as char matrices in code. Runs standalone in browser and as Telegram Mini App (static, no backend). High score in Telegram `CloudStorage` w/ `localStorage` fallback. Deploy via GitHub Actions → Pages.

Source design: [Brainstorm report](../reports/brainstorm-260930-1008-pixel-trex-runner-telegram-mini-app.md)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Project Setup](./phase-01-project-setup.md) | Pending |
| 2 | [Pixel Sprites And Renderer](./phase-02-pixel-sprites-and-renderer.md) | Pending |
| 3 | [Core Gameplay Engine](./phase-03-core-gameplay-engine.md) | Pending |
| 4 | [Scenery, Day/Night And Audio](./phase-04-scenery-day-night-and-audio.md) | Pending |
| 5 | [Telegram Integration](./phase-05-telegram-integration.md) | Pending |
| 6 | [Testing And Deploy](./phase-06-testing-and-deploy.md) | Pending |

## Dependency Chain

1 → 2 → 3 → (4 ∥ 5) → 6. Phases 4 & 5 touch disjoint files; can run parallel.

## Key Constants (Chrome-derived)

- Logical canvas 600×150; ground y=127; integer scale.
- Speed 6 → 13, accel 0.001/frame; score = distance × 0.025.
- Pterodactyl min score 450; heights y ∈ {100, 75, 50}.
- Day/night toggle every 700 pts; milestone every 100.
- Fixed step 1000/60 ms.

## Dependencies

- Node 22, Vite 7, TypeScript 5, Vitest.
- `telegram-web-app.js` loaded from `https://telegram.org/js/telegram-web-app.js` (official).
- GitHub repo + Pages enabled; BotFather bot for Mini App registration (manual, user-owned).

## Decisions

- Game title: **J1 Rex**
- GitHub repo: **j1-rex-runner** → Vite `base` = `/j1-rex-runner/`
