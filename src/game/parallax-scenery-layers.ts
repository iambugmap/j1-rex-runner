import { WORLD } from '../config/game-balance-constants'
import { randomInt, type RandomFn } from '../engine/seeded-random'
import { CLOUD, MOUNTAIN } from '../sprites/background-scenery-sprites'

/** Background layers scrolling at fractions of game speed to fake depth. */

export interface SceneryItem {
  x: number
  readonly y: number
}

export interface Pebble extends SceneryItem {
  readonly size: number
}

const CLOUD_PARALLAX = 0.2
const MOUNTAIN_PARALLAX = 0.1
const MOUNTAIN_SPACING = 150
const CLOUD_COUNT = 4
const PEBBLE_COUNT = 36

export class ParallaxScenery {
  readonly clouds: SceneryItem[]
  readonly mountains: SceneryItem[]
  readonly pebbles: Pebble[]

  constructor(private readonly rng: RandomFn) {
    this.clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => this.newCloud(i * (WORLD.width / CLOUD_COUNT) + 40))
    const mountainCount = Math.ceil(WORLD.width / MOUNTAIN_SPACING) + 1
    this.mountains = Array.from({ length: mountainCount }, (_, i) => ({
      x: i * MOUNTAIN_SPACING + randomInt(rng, 0, 40),
      y: WORLD.groundY - MOUNTAIN.height,
    }))
    this.pebbles = Array.from({ length: PEBBLE_COUNT }, () => ({
      x: randomInt(rng, 0, WORLD.width),
      y: randomInt(rng, WORLD.groundY + 3, WORLD.height - 4),
      size: randomInt(rng, 1, 3),
    }))
  }

  update(speed: number): void {
    const span = this.mountains.length * MOUNTAIN_SPACING
    for (const mountain of this.mountains) {
      mountain.x -= speed * MOUNTAIN_PARALLAX
      if (mountain.x + MOUNTAIN.width < 0) mountain.x += span
    }

    for (let i = 0; i < this.clouds.length; i++) {
      this.clouds[i].x -= speed * CLOUD_PARALLAX
      if (this.clouds[i].x + CLOUD.width < 0) this.clouds[i] = this.newCloud(WORLD.width + randomInt(this.rng, 0, 120))
    }

    for (const pebble of this.pebbles) {
      pebble.x -= speed
      if (pebble.x + pebble.size < 0) pebble.x += WORLD.width + pebble.size
    }
  }

  private newCloud(x: number): SceneryItem {
    return { x, y: randomInt(this.rng, 12, 60) }
  }
}
