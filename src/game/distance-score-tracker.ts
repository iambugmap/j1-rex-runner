import { SCORE } from '../config/game-balance-constants'

/** Distance-based scoring, milestone detection and high score bookkeeping. */
export class DistanceScoreTracker {
  private distance = 0
  private best = 0
  private flashRemaining = 0

  get score(): number {
    return Math.floor(this.distance * SCORE.coefficient)
  }

  get highScore(): number {
    return this.best
  }

  /** True while the score should blink after crossing a milestone. */
  get isFlashing(): boolean {
    return this.flashRemaining > 0
  }

  get flashStepsRemaining(): number {
    return this.flashRemaining
  }

  /** Adds distance for one step. Returns true when a milestone (every 100 pts) is crossed. */
  advance(speed: number): boolean {
    const before = this.score
    this.distance += Math.max(0, speed)
    if (this.flashRemaining > 0) this.flashRemaining--

    const crossed = Math.floor(this.score / SCORE.milestone) > Math.floor(before / SCORE.milestone)
    if (crossed) this.flashRemaining = SCORE.flashSteps
    return crossed
  }

  /** Seeds the high score from storage; never lowers it. Invalid values are ignored. */
  setHighScore(value: number): void {
    if (Number.isFinite(value) && value > this.best) this.best = Math.floor(value)
  }

  /** Promotes the current score to high score. Returns true on a new record. */
  commitHighScore(): boolean {
    if (this.score <= this.best) return false
    this.best = this.score
    return true
  }

  reset(): void {
    this.distance = 0
    this.flashRemaining = 0
  }
}
