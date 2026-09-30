# Phase 06 — Testing And Deploy

## Context Links
- [Plan](./plan.md) · GitHub Pages Actions: `actions/upload-pages-artifact`, `actions/deploy-pages`

## Overview
- Priority: P1 · Status: Pending · Effort: 2h
- Consolidate tests, CI build+test, deploy to GitHub Pages, register Mini App in BotFather, update docs.

## Key Insights
- Pages serves under `/<repo>/` → build with `VITE_BASE=/<repo>/`.
- Telegram requires HTTPS URL — Pages provides.
- Bundle budget: < 50KB gzip (expect ~10–15KB).

## Requirements
- CI: on push to `main` → `npm ci` → `npm test` → `npm run build` → deploy. Tests failing blocks deploy.
- Manual QA checklist on real devices inside Telegram.

## Architecture
```
.github/workflows/deploy-github-pages.yml
  jobs: build (checkout, setup-node 22, npm ci, test, build w/ VITE_BASE) → deploy (pages)
```

## Related Code Files
- Create: `.github/workflows/deploy-github-pages.yml`
- Modify: `README.md` (deploy + BotFather steps), `docs/` (replace boilerplate: `project-overview-pdr.md`, `codebase-summary.md`, `system-architecture.md`, `code-standards.md`, `project-roadmap.md` game-relevant sections; add `deployment-guide.md`)

## Implementation Steps
1. Ensure unit test coverage ≥ 80% on `src/game/*`, `src/storage/*`.
2. Workflow with `permissions: pages: write, id-token: write`; `VITE_BASE: /${{ github.event.repository.name }}/`.
3. User creates GitHub repo + enables Pages (Source: GitHub Actions) — user action.
4. BotFather: `/newbot` → `/newapp` (or Bot Settings → Menu Button) → Pages URL — user action.
5. Manual QA (below).
6. Delegate docs update to docs-manager.

## Manual QA Checklist
- [ ] Desktop Chrome/Safari: keyboard controls, resize.
- [ ] Android Telegram: tap jump, swipe duck no-close, haptics, audio, 60fps.
- [ ] iOS Telegram: same + audio after first tap, safe area notch.
- [ ] Reopen app → high score persisted; other device → synced.
- [ ] Background app mid-run → paused on return.

## Todo List
- [ ] coverage ≥ 80% on logic
- [ ] CI workflow
- [ ] repo + Pages (user)
- [ ] BotFather registration (user)
- [ ] manual QA
- [ ] docs update

## Success Criteria
- Green CI, live Pages URL, Mini App opens from bot; QA checklist passes.

## Risk Assessment
- Wrong base path → blank page (404 assets). Verify with `npm run preview` using same VITE_BASE.

## Security Considerations
- No secrets needed (Pages via OIDC). Never commit bot token.

## Next Steps
- Future: Telegram Game API leaderboard; skins; share-score button (`switchInlineQuery`).
