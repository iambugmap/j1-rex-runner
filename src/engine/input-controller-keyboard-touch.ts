/**
 * Maps keyboard, mouse and touch into four intents. Pointer Events are used exclusively so a
 * single touch never fires twice (touch + synthetic mouse).
 *
 * - Jump: Space / ArrowUp / W, or a tap/click anywhere that is not a button.
 * - Duck: ArrowDown / S, or holding the on-screen duck button.
 *
 * Held actions are force-released when the window loses focus or is hidden, so a key or finger
 * lifted outside the page can never leave the T-rex stuck ducking or jumping.
 */

export interface InputHandlers {
  onJumpStart(): void
  onJumpEnd(): void
  onDuckStart(): void
  onDuckEnd(): void
}

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW'])
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS'])

const hasShortcutModifier = (event: KeyboardEvent): boolean => event.ctrlKey || event.metaKey || event.altKey

/** Attaches listeners and returns a function that removes them all. */
export function attachInput(handlers: InputHandlers, duckButton: HTMLElement | null): () => void {
  /** Pointer currently holding the jump (so lifting the DUCK finger doesn't end the jump). */
  let jumpPointerId: number | undefined

  const releaseAll = (): void => {
    jumpPointerId = undefined
    duckButton?.classList.remove('is-pressed')
    handlers.onJumpEnd()
    handlers.onDuckEnd()
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (hasShortcutModifier(event)) return // leave browser shortcuts (Ctrl+S, Cmd+W…) alone
    if (JUMP_KEYS.has(event.code)) {
      event.preventDefault() // stop page scroll / focused-button activation
      if (!event.repeat) handlers.onJumpStart()
    } else if (DUCK_KEYS.has(event.code)) {
      event.preventDefault()
      if (!event.repeat) handlers.onDuckStart()
    }
  }

  const onKeyUp = (event: KeyboardEvent): void => {
    if (JUMP_KEYS.has(event.code)) {
      event.preventDefault() // Space keyup would otherwise "click" a focused button
      handlers.onJumpEnd()
    } else if (DUCK_KEYS.has(event.code)) {
      handlers.onDuckEnd()
    }
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    // Buttons (mute, duck) handle their own input.
    if (event.target instanceof Element && event.target.closest('button')) return
    jumpPointerId = event.pointerId
    handlers.onJumpStart()
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== jumpPointerId) return
    jumpPointerId = undefined
    handlers.onJumpEnd()
  }

  const onDuckDown = (event: PointerEvent): void => {
    event.preventDefault()
    duckButton?.setPointerCapture(event.pointerId)
    duckButton?.classList.add('is-pressed')
    handlers.onDuckStart()
  }

  const onDuckUp = (): void => {
    duckButton?.classList.remove('is-pressed')
    handlers.onDuckEnd()
  }

  const onVisibilityChange = (): void => {
    if (document.hidden) releaseAll()
  }

  // Long-press on mobile would otherwise open a context menu on the button.
  const preventMenu = (event: Event): void => event.preventDefault()

  const windowListeners: Array<[string, EventListener]> = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['pointerdown', onPointerDown as EventListener],
    ['pointerup', onPointerUp as EventListener],
    ['pointercancel', onPointerUp as EventListener],
    ['blur', releaseAll],
  ]
  const duckListeners: Array<[string, EventListener]> = [
    ['pointerdown', onDuckDown as EventListener],
    ['pointerup', onDuckUp],
    ['pointercancel', onDuckUp],
    ['contextmenu', preventMenu],
  ]

  windowListeners.forEach(([type, listener]) => window.addEventListener(type, listener))
  duckListeners.forEach(([type, listener]) => duckButton?.addEventListener(type, listener))
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    windowListeners.forEach(([type, listener]) => window.removeEventListener(type, listener))
    duckListeners.forEach(([type, listener]) => duckButton?.removeEventListener(type, listener))
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
