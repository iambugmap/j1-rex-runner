import { defineSprite, type SpriteFrame } from '../engine/sprite-frame-definition'

/** Cactus obstacles. Spawned alone or in touching groups of up to three. */

/** 6 columns × 12 rows (18×36 logical px). */
export const CACTUS_SMALL: SpriteFrame = defineSprite([
  '..##..',
  '..##..',
  '..##.#',
  '#.##.#',
  '#.##.#',
  '#.####',
  '####..',
  '..##..',
  '..##..',
  '..##..',
  '..##..',
  '..##..',
])

/** 8 columns × 16 rows (24×48 logical px). */
export const CACTUS_LARGE: SpriteFrame = defineSprite([
  '...##...',
  '..####..',
  '..####..',
  '..####.#',
  '#.####.#',
  '#.####.#',
  '#.####.#',
  '#.######',
  '#.####..',
  '######..',
  '..####..',
  '..####..',
  '..####..',
  '..####..',
  '..####..',
  '..####..',
])
