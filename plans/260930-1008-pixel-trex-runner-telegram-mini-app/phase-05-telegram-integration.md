# Phase 05 — Telegram Integration

## Context Links
- [Plan](./plan.md) · Docs: https://core.telegram.org/bots/webapps (verify latest via docs-seeker before impl)

## Overview
- Priority: P1 · Status: Pending · Effort: 2h
- Thin bridge over `window.Telegram.WebApp` with graceful no-op fallback outside Telegram.

## Key Insights
- Vertical swipe on Mini App collapses/closes it → conflicts with swipe-down duck. `disableVerticalSwipes()` (Bot API 7.7+). If unsupported (`isVersionAtLeast('7.7')` false) → show on-screen duck button, disable swipe-duck.
- `CloudStorage` API is callback-based, values are strings, 1024 keys/user, 4096 chars/value. Wrap in Promise; timeout 2s → fall back to localStorage.
- High score source of truth: max(local, cloud) on load; write both on new record.
- Theme: we keep own navy/cream palette, but set `setHeaderColor`/`setBackgroundColor` to paper color so chrome matches.
- `safeAreaInset` / `contentSafeAreaInset` (Bot API 8.0+) → CSS vars `--tg-safe-area-inset-*` auto-provided by SDK; use in CSS padding with fallback 0.

## Requirements
- `ready()` ASAP after first render; `expand()`.
- Haptics: `impactOccurred('heavy')` on crash, `notificationOccurred('success')` on new high score, `selectionChanged()` on milestone (light).
- Pause on `activated`/`deactivated` events (Bot API 8.0+) and `document.visibilitychange` (fallback).
- Works identically in plain browser (all calls no-op).

## Architecture
```ts
// telegram/telegram-webapp-bridge.ts
export interface TelegramBridge {
  isTelegram: boolean
  init(): void                          // ready, expand, disableVerticalSwipes, colors
  supportsSwipeLock: boolean
  haptic(kind: 'crash'|'record'|'milestone'): void
  onVisibilityChange(cb: (active: boolean) => void): void
}
// storage/high-score-storage.ts
export async function loadHighScore(): Promise<number>
export async function saveHighScore(score: number): Promise<void>
```
Minimal hand-written type decl `telegram/telegram-webapp-types.d.ts` for used APIs only (no `@types` dep — YAGNI).

## Related Code Files
- Create: `src/telegram/telegram-webapp-bridge.ts`, `src/telegram/telegram-webapp-types.d.ts`, `src/storage/high-score-storage.ts`
- Modify: `src/main.ts` (init bridge, route events → haptics, pause), `index.html`/`styles.css` (duck button visibility, safe-area padding)

## Implementation Steps
1. Types decl for subset: `ready, expand, disableVerticalSwipes, isVersionAtLeast, HapticFeedback, CloudStorage.getItem/setItem, onEvent, setHeaderColor, setBackgroundColor`.
2. Bridge: detect via `window.Telegram?.WebApp?.initData !== undefined` and platform != 'unknown'.
3. High score storage: validate parsed value (`Number.isFinite && >=0 && < 1e7`), else 0.
4. Wire into main: bridge.init() → load high score → start loop in READY state.
5. Duck button: shown when `!supportsSwipeLock` or always on touch devices? → show only when needed (KISS).
6. Local test via `cloudflared tunnel --url http://localhost:5173` + BotFather test Mini App URL.

## Todo List
- [ ] types decl
- [ ] bridge w/ no-op fallback
- [ ] high score storage (cloud + local, validation, timeout)
- [ ] haptics routing
- [ ] pause on deactivate/visibility
- [ ] swipe lock / duck button fallback
- [ ] safe-area CSS
- [ ] tests: storage validation + fallback (mock CloudStorage)

## Success Criteria
- In Telegram (iOS + Android): no accidental close on swipe-down; haptics fire; high score persists after reopen & across devices.
- Outside Telegram: no console errors.

## Risk Assessment
- Older clients lack APIs → guard every call w/ `isVersionAtLeast`.
- Vite dev server behind tunnel may block host → set `server.allowedHosts: true` in dev only.

## Security Considerations
- `initData` not sent anywhere (no backend) → no validation needed now. If leaderboard added later, MUST validate initData HMAC server-side.
- CloudStorage values user-controllable → validate on read (done).

## Next Steps
- Phase 06 deploy + BotFather setup.
