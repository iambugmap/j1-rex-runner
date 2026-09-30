# Phase 01 — Project Setup

## Context Links
- [Plan](./plan.md) · [Brainstorm](../reports/brainstorm-260930-1008-pixel-trex-runner-telegram-mini-app.md)

## Overview
- Priority: P1 · Status: Pending · Effort: 1h
- Scaffold Vite + TS project, mobile-first HTML shell, strict TS, Vitest.

## Key Insights
- Repo root currently holds ClaudeKit boilerplate (`.claude/`, `docs/`, `plans/`). Scaffold game into repo root without clobbering these (don't run `npm create vite` into non-empty dir interactively; create files manually).
- Telegram webview = mobile Chromium/WKWebView → need viewport meta w/ `user-scalable=no`, `touch-action: none` on game area, no text selection.

## Requirements
- Functional: `npm run dev` serves blank canvas page; `npm run build` emits `dist/`; `npm test` runs Vitest.
- Non-functional: zero runtime deps; TS `strict: true`.

## Architecture
```
index.html            # shell: HUD div + <canvas id="game"> + optional duck button
src/main.ts           # bootstrap (placeholder this phase)
src/styles.css        # layout: portrait column, strip centered, CSS vars for palette
vite.config.ts        # base path from env VITE_BASE ?? '/'
tsconfig.json
package.json
.gitignore
```

## Related Code Files
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/styles.css`, `.gitignore`, `README.md` (game-specific section)
- Modify: none · Delete: none

## Implementation Steps
1. `git init`; `.gitignore` → `node_modules`, `dist`, `.DS_Store`, `.bi-kit/`, `coverage`.
2. `package.json` scripts: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test` (`vitest run`), `test:watch`.
3. `npm i -D vite typescript vitest @types/node`.
4. `vite.config.ts`: `base: process.env.VITE_BASE ?? '/'`, `build.target: 'es2020'`, vitest `environment: 'node'`.
5. `index.html`: viewport `width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover`; include `<script src="https://telegram.org/js/telegram-web-app.js"></script>` BEFORE app script (sync, per Telegram docs).
6. `styles.css`: `:root { --ink:#1F2A44; --paper:#F5EFE0 }`; body flex column; canvas `image-rendering: pixelated; width:100%; touch-action:none`; `user-select:none; -webkit-tap-highlight-color:transparent`.
7. Update `README.md` with a Game section: run/build/test commands.

## Todo List
- [ ] git init + .gitignore
- [ ] package.json + deps
- [ ] tsconfig strict
- [ ] vite.config.ts with base env
- [ ] index.html shell + Telegram SDK script tag
- [ ] styles.css palette + pixelated canvas
- [ ] README game section

## Success Criteria
- `npm run build` and `npm test` (0 tests ok, `--passWithNoTests`) succeed.
- Page loads on mobile w/o zoom/scroll.

## Risk Assessment
- Telegram SDK script offline in local dev → bridge must tolerate `window.Telegram` undefined (phase 05).

## Security Considerations
- Only external script = official telegram.org SDK. No secrets in repo.

## Next Steps
- Phase 02 sprites/renderer.
