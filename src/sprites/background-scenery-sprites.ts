import { defineSprite, type SpriteFrame } from '../engine/sprite-frame-definition'

/** Non-colliding decoration: parallax clouds and mountains, plus the restart icon. */

/** 14 columns × 4 rows (42×12 logical px). */
export const CLOUD: SpriteFrame = defineSprite([
  '....####......',
  '..########.##.',
  '.#############',
  '##############',
])

/** 24 columns × 8 rows (72×24 logical px). */
export const MOUNTAIN: SpriteFrame = defineSprite([
  '..........##............',
  '.........####...........',
  '........######......##..',
  '.......########....####.',
  '.....###########..######',
  '...#####################',
  '.#######################',
  '########################',
])

/** Circular "try again" arrow shown on the game-over screen. 8×7 cells. */
export const RESTART_ICON: SpriteFrame = defineSprite([
  '..####.#',
  '.#....##',
  '#....###',
  '#.......',
  '#......#',
  '.#....#.',
  '..####..',
])
