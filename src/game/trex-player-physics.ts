import { TREX, WORLD } from '../config/game-balance-constants'
import type { Rect, SpriteFrame } from '../engine/sprite-frame-definition'
import {
  TREX_CRASHED,
  TREX_DUCK_FRAMES,
  TREX_RUN_FRAMES,
  TREX_STANDING,
} from '../sprites/trex-sprite-frames'
import { offsetRects } from './hitbox-collision'

export type TrexPose = 'idle' | 'run' | 'jump' | 'duck' | 'crash'

/**
 * Player physics & animation. Height is tracked as `lift` (pixels above ground, up = positive).
 * Mutable by design: it is stepped 60×/s and allocating new state each step would be wasteful.
 */
export class TrexPlayer {
  private lift = 0
  private velocity = 0
  private airborne = false
  private jumpHeld = false
  private duckHeld = false
  private speedDrop = false
  private crashed = false
  private running = false
  private animationSteps = 0

  get height(): number {
    return this.lift
  }

  get isAirborne(): boolean {
    return this.airborne
  }

  get pose(): TrexPose {
    if (this.crashed) return 'crash'
    if (this.airborne) return 'jump'
    if (this.duckHeld && this.running) return 'duck'
    return this.running ? 'run' : 'idle'
  }

  get frame(): SpriteFrame {
    const cycle = Math.floor(this.animationSteps / TREX.runFrameSteps) % 2
    switch (this.pose) {
      case 'crash':
        return TREX_CRASHED
      case 'run':
        return TREX_RUN_FRAMES[cycle]
      case 'duck':
        return TREX_DUCK_FRAMES[cycle]
      default:
        return TREX_STANDING
    }
  }

  get x(): number {
    return TREX.x
  }

  /** Top edge in world coordinates for the current frame. */
  get y(): number {
    return WORLD.groundY - this.frame.height - this.lift
  }

  hitboxes(): Rect[] {
    return offsetRects(this.frame.hitboxes, this.x, this.y)
  }

  bounds(): Rect {
    const frame = this.frame
    return { x: this.x, y: this.y, w: frame.width, h: frame.height }
  }

  startRunning(): void {
    this.running = true
  }

  /** Returns true when a jump actually started (only possible from the ground). */
  pressJump(): boolean {
    if (this.airborne || this.crashed) return false
    this.airborne = true
    this.jumpHeld = true
    this.velocity = TREX.jumpVelocity
    return true
  }

  releaseJump(): void {
    this.jumpHeld = false
  }

  pressDuck(): void {
    this.duckHeld = true
    // Ducking mid-air cancels the rise and falls faster (Chrome's "speed drop").
    if (this.airborne && !this.crashed) {
      this.speedDrop = true
      this.velocity = Math.min(this.velocity, -1)
    }
  }

  releaseDuck(): void {
    this.duckHeld = false
    this.speedDrop = false
  }

  crash(): void {
    this.crashed = true
  }

  reset(): void {
    this.lift = 0
    this.velocity = 0
    this.airborne = false
    this.jumpHeld = false
    this.duckHeld = false
    this.speedDrop = false
    this.crashed = false
    this.running = false
    this.animationSteps = 0
  }

  step(): void {
    if (this.crashed) return
    this.animationSteps++
    if (!this.airborne) return

    this.lift += this.velocity
    this.velocity -= TREX.gravity * (this.speedDrop ? TREX.speedDropCoefficient : 1)

    // Variable jump height: releasing early (after the minimum) or hitting the ceiling
    // caps the upward velocity so the arc tops out sooner.
    if (this.velocity > TREX.dropVelocity) {
      const releasedAfterMin = !this.jumpHeld && this.lift >= TREX.minJumpHeight
      if (releasedAfterMin || this.lift >= TREX.maxJumpHeight) this.velocity = TREX.dropVelocity
    }

    if (this.lift <= 0) {
      this.lift = 0
      this.velocity = 0
      this.airborne = false
      this.speedDrop = false
    }
  }
}
