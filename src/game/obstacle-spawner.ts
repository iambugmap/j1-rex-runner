import { COLLISION_TOLERANCE, OBSTACLE, WORLD } from '../config/game-balance-constants'
import { randomInt, randomPick, type RandomFn } from '../engine/seeded-random'
import type { Rect, SpriteFrame } from '../engine/sprite-frame-definition'
import { CACTUS_LARGE, CACTUS_SMALL } from '../sprites/cactus-sprite-variants'
import { PTERO_FRAMES } from '../sprites/pterodactyl-sprite-frames'
import { anyRectsOverlap, offsetRects, rectsOverlap } from './hitbox-collision'

export type ObstacleKind = 'cactus-small' | 'cactus-large' | 'ptero'

interface ObstacleSpec {
  readonly kind: ObstacleKind
  readonly frames: readonly SpriteFrame[]
  /** Base gap in px before the next obstacle (scaled by gapCoefficient). */
  readonly minGap: number
  /** Groups of 2–3 only appear above this speed. */
  readonly multipleSpeed: number
  readonly minScore: number
  /** Possible heights of the obstacle's bottom above the ground. */
  readonly lifts: readonly number[]
  readonly speedOffset: number
}

const SPECS: readonly ObstacleSpec[] = [
  { kind: 'cactus-small', frames: [CACTUS_SMALL], minGap: 120, multipleSpeed: 4, minScore: 0, lifts: [0], speedOffset: 0 },
  { kind: 'cactus-large', frames: [CACTUS_LARGE], minGap: 120, multipleSpeed: 7, minScore: 0, lifts: [0], speedOffset: 0 },
  {
    kind: 'ptero',
    frames: PTERO_FRAMES,
    minGap: 150,
    multipleSpeed: Infinity,
    minScore: OBSTACLE.pteroMinScore,
    lifts: OBSTACLE.pteroLifts,
    speedOffset: OBSTACLE.pteroSpeedOffset,
  },
]

export interface Obstacle {
  readonly kind: ObstacleKind
  readonly frames: readonly SpriteFrame[]
  /** Number of identical units drawn side by side (cactus groups). */
  readonly count: number
  x: number
  readonly y: number
  readonly width: number
  readonly speedOffset: number
  readonly gapAfter: number
  animationSteps: number
}

/** Gap (px) the next obstacle must wait for; grows with speed so jumps stay possible. */
export function computeGap(width: number, speed: number, minGap: number, rng: RandomFn): number {
  const min = Math.round(width * speed + minGap * OBSTACLE.gapCoefficient)
  const max = Math.round(min * OBSTACLE.maxGapCoefficient)
  return randomInt(rng, min, max)
}

export function obstacleFrame(obstacle: Obstacle): SpriteFrame {
  const index = Math.floor(obstacle.animationSteps / OBSTACLE.pteroFlapSteps) % obstacle.frames.length
  return obstacle.frames[index]
}

/** World-space hitboxes of every unit in the obstacle. */
export function obstacleHitboxes(obstacle: Obstacle): Rect[] {
  const frame = obstacleFrame(obstacle)
  const boxes: Rect[] = []
  for (let i = 0; i < obstacle.count; i++) {
    boxes.push(...offsetRects(frame.hitboxes, obstacle.x + i * frame.width, obstacle.y))
  }
  return boxes
}

export class ObstacleSpawner {
  private obstacles: Obstacle[] = []
  private history: ObstacleKind[] = []
  private warmup: number = OBSTACLE.warmupSteps

  constructor(private readonly rng: RandomFn) {}

  get items(): readonly Obstacle[] {
    return this.obstacles
  }

  reset(): void {
    this.obstacles = []
    this.history = []
    this.warmup = OBSTACLE.warmupSteps
  }

  update(speed: number, score: number): void {
    for (const obstacle of this.obstacles) {
      obstacle.x -= speed + obstacle.speedOffset
      obstacle.animationSteps++
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > 0)

    if (this.warmup > 0) {
      this.warmup--
      return
    }
    const last = this.obstacles[this.obstacles.length - 1]
    if (!last || last.x + last.width + last.gapAfter < WORLD.width) {
      this.obstacles.push(this.spawn(speed, score))
    }
  }

  /** Cheap bounds pre-check first, then per-hitbox overlap. */
  collidesWith(playerBounds: Rect, playerHitboxes: readonly Rect[]): boolean {
    return this.obstacles.some((o) => {
      const bounds = { x: o.x, y: o.y, w: o.width, h: obstacleFrame(o).height }
      if (!rectsOverlap(playerBounds, bounds)) return false
      return anyRectsOverlap(playerHitboxes, obstacleHitboxes(o), COLLISION_TOLERANCE)
    })
  }

  private spawn(speed: number, score: number): Obstacle {
    const spec = this.pickSpec(score)
    const frame = spec.frames[0]
    const count = speed > spec.multipleSpeed ? randomInt(this.rng, 1, 3) : 1
    const width = frame.width * count
    const lift = randomPick(this.rng, spec.lifts)

    this.history = [...this.history, spec.kind].slice(-OBSTACLE.maxDuplication)
    return {
      kind: spec.kind,
      frames: spec.frames,
      count,
      x: WORLD.width,
      y: WORLD.groundY - frame.height - lift,
      width,
      speedOffset: spec.speedOffset > 0 && this.rng() < 0.5 ? -spec.speedOffset : spec.speedOffset,
      gapAfter: computeGap(width, speed, spec.minGap, this.rng),
      animationSteps: 0,
    }
  }

  /** Random eligible kind, avoiding more than `maxDuplication` repeats in a row. */
  private pickSpec(score: number): ObstacleSpec {
    const eligible = SPECS.filter((s) => score >= s.minScore)
    const repeated =
      this.history.length >= OBSTACLE.maxDuplication && this.history.every((k) => k === this.history[0])
        ? this.history[0]
        : undefined
    const varied = eligible.filter((s) => s.kind !== repeated)
    return randomPick(this.rng, varied.length > 0 ? varied : eligible)
  }
}
