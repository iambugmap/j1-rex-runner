import { GESTURE, TouchGestureClassifier, type GestureAction } from './touch-gesture-classifier'

/**
 * Maps keyboard, mouse and touch into four intents. Pointer Events are used exclusively so a
 * single touch never fires twice (touch + synthetic mouse).
 *
 * - Jump: Space / ArrowUp / W, or a tap anywhere that is not a button (hold = higher jump).
 * - Duck: ArrowDown / S, or a downward swipe held until the finger lifts (see
 *   touch-gesture-classifier for how taps and swipes are told apart).
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
export function attachInput(handlers: InputHandlers): () => void {
  const gesture = new TouchGestureClassifier()
  /** Only the first finger drives the gesture; extra fingers are ignored. */
  let activePointerId: number | undefined
  let decisionTimer: ReturnType<typeof setTimeout> | undefined

  const apply = (actions: readonly GestureAction[]): void => {
    for (const action of actions) {
      if (action === 'jumpStart') handlers.onJumpStart()
      else if (action === 'jumpEnd') handlers.onJumpEnd()
      else if (action === 'duckStart') handlers.onDuckStart()
      else handlers.onDuckEnd()
    }
  }

  const clearDecisionTimer = (): void => {
    if (decisionTimer !== undefined) clearTimeout(decisionTimer)
    decisionTimer = undefined
  }

  const endGesture = (): void => {
    clearDecisionTimer()
    activePointerId = undefined
    apply(gesture.up())
  }

  const releaseAll = (): void => {
    endGesture()
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
    if (event.button !== 0 || activePointerId !== undefined) return
    // Buttons (e.g. sound toggle) handle their own input.
    if (event.target instanceof Element && event.target.closest('button')) return
    activePointerId = event.pointerId
    apply(gesture.down(event.clientY, event.timeStamp))
    clearDecisionTimer()
    // A finger held perfectly still produces no move events, so resolve it on a timer.
    decisionTimer = setTimeout(() => apply(gesture.timeout(performance.now())), GESTURE.decisionMs)
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId === activePointerId) apply(gesture.move(event.clientY, event.timeStamp))
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId === activePointerId) endGesture()
  }

  const onVisibilityChange = (): void => {
    if (document.hidden) releaseAll()
  }

  const windowListeners: Array<[string, EventListener]> = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['pointerdown', onPointerDown as EventListener],
    ['pointermove', onPointerMove as EventListener],
    ['pointerup', onPointerUp as EventListener],
    ['pointercancel', onPointerUp as EventListener],
    ['blur', releaseAll],
  ]

  windowListeners.forEach(([type, listener]) => window.addEventListener(type, listener))
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    clearDecisionTimer()
    windowListeners.forEach(([type, listener]) => window.removeEventListener(type, listener))
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
