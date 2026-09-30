import { SCORE } from '../config/game-balance-constants'
import { DAY_PALETTE, mixHex, NIGHT_PALETTE, type Palette } from './palette-colors'

/** Night during every odd 700-point block (700–1399, 2100–2799, …). */
export function isNightScore(score: number): boolean {
  return score > 0 && Math.floor(score / SCORE.dayNightPeriod) % 2 === 1
}

/**
 * Smoothly fades between day and night. The background color is interpolated; ink colors
 * snap at the halfway point so prerendered sprites only ever need two color variants.
 */
export class DayNightCycle {
  private blend = 0

  /** 0 = full day, 1 = full night. */
  get nightBlend(): number {
    return this.blend
  }

  update(score: number): void {
    const target = isNightScore(score) ? 1 : 0
    if (this.blend < target) this.blend = Math.min(target, this.blend + SCORE.dayNightFadePerStep)
    else if (this.blend > target) this.blend = Math.max(target, this.blend - SCORE.dayNightFadePerStep)
  }

  palette(): Palette {
    const base = this.blend < 0.5 ? DAY_PALETTE : NIGHT_PALETTE
    return { ...base, paper: mixHex(DAY_PALETTE.paper, NIGHT_PALETTE.paper, this.blend) }
  }

  reset(): void {
    this.blend = 0
  }
}
