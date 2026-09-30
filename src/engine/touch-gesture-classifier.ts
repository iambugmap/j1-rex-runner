/**
 * Turns a single pointer's down/move/up stream into jump/duck intents (pure, DOM-free).
 *
 * A touch starts "pending" and is resolved as soon as the intent is clear:
 * - dragged DOWN past the threshold            → duck (held until the finger lifts;
 *                                                 mid-air this becomes a fast fall)
 * - lifted, dragged UP, or held still for       → jump (held until the finger lifts, so a
 *   `decisionMs`                                   longer press still gives a higher jump)
 * A held jump can still be turned into a duck by dragging down, for a quick fast-fall.
 */

export type GestureAction = 'jumpStart' | 'jumpEnd' | 'duckStart' | 'duckEnd'

export const GESTURE = {
  /** Max time a still finger waits before it counts as a jump. */
  decisionMs: 70,
  /** Vertical drag (CSS px) that counts as a swipe. */
  swipeThresholdPx: 12,
} as const

type GestureState = 'idle' | 'pending' | 'jump' | 'duck'

export class TouchGestureClassifier {
  private state: GestureState = 'idle'
  private startY = 0
  private startTime = 0

  get isActive(): boolean {
    return this.state !== 'idle'
  }

  down(y: number, time: number): GestureAction[] {
    // A new touch replaces any stale one (e.g. a lost pointerup).
    const released = this.up()
    this.state = 'pending'
    this.startY = y
    this.startTime = time
    return released
  }

  move(y: number, time: number): GestureAction[] {
    const dy = y - this.startY
    if (this.state === 'pending') {
      if (dy >= GESTURE.swipeThresholdPx) return this.becomeDuck()
      if (dy <= -GESTURE.swipeThresholdPx) return this.becomeJump()
      return this.timeout(time)
    }
    if (this.state === 'jump' && dy >= GESTURE.swipeThresholdPx) {
      return ['jumpEnd', ...this.becomeDuck()]
    }
    return []
  }

  /** Called from a timer (and on moves) so a still finger resolves to a jump. */
  timeout(time: number): GestureAction[] {
    if (this.state === 'pending' && time - this.startTime >= GESTURE.decisionMs) return this.becomeJump()
    return []
  }

  up(): GestureAction[] {
    const previous = this.state
    this.state = 'idle'
    switch (previous) {
      case 'pending':
        return ['jumpStart', 'jumpEnd'] // quick tap = short hop
      case 'jump':
        return ['jumpEnd']
      case 'duck':
        return ['duckEnd']
      default:
        return []
    }
  }

  private becomeJump(): GestureAction[] {
    this.state = 'jump'
    return ['jumpStart']
  }

  private becomeDuck(): GestureAction[] {
    this.state = 'duck'
    return ['duckStart']
  }
}
