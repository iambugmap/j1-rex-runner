# J1 Rex

Pixel-art endless runner inspired by Chrome's offline dino game, built to run in any browser and as a **Telegram Mini App**.

- Flat, blocky pixel sprites (navy on cream) defined as character matrices in code — no image assets.
- Jump cacti, duck under flying dinos, score by distance; speed ramps up, day/night flips every 700 points.
- 8-bit sound effects synthesized with WebAudio.
- High score saved locally and synced across devices through Telegram `CloudStorage`.
- Vite + TypeScript + Canvas 2D, zero runtime dependencies (~8 KB gzipped JS).

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Start / jump / restart | `Space`, `↑`, `W` | Tap anywhere |
| Higher jump | Hold jump | Hold tap |
| Duck / fast fall | `↓`, `S` | Swipe down and hold |

## Development

Requires Node 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run coverage   # coverage report
npm run build      # typecheck + production build to dist/
```

In dev mode the running session is exposed as `window.__j1rex` for debugging.

## Project structure

```
src/
  main.ts                 composition root (DOM, loop, input, audio, storage, Telegram)
  config/                 all gameplay tuning constants
  engine/                 loop, input, sprite model/renderer, pixel text, seeded RNG, canvas scaling
  sprites/                pixel-art matrices (T-rex, cacti, pterodactyl, scenery, font)
  game/                   pure game logic: physics, spawner, collision, score, day/night, state machine, scene renderer
  audio/                  WebAudio chiptune SFX
  storage/                high score persistence (localStorage + Telegram CloudStorage)
  telegram/               Telegram Mini App SDK bridge (no-op outside Telegram)
```

## Deploy

Every push to `main` runs tests, builds and publishes to GitHub Pages via `.github/workflows/deploy-github-pages.yml`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Live URL: `https://iambugmap.github.io/j1-rex-runner/`

## Telegram Mini App setup

1. In [@BotFather](https://t.me/BotFather): `/newbot` (or pick an existing bot).
2. `/newapp` → choose the bot → set the Web App URL to the GitHub Pages URL above.
   Alternatively: **Bot Settings → Menu Button** → same URL.
3. Open the bot in Telegram and launch the app.

To test local changes inside Telegram, expose the dev server over HTTPS (e.g. `cloudflared tunnel --url http://localhost:5173`) and point a test Mini App at the tunnel URL.
