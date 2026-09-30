import { defineSprite, type SpriteFrame } from '../engine/sprite-frame-definition'

/**
 * J1 Rex — the player character. Flat blocky silhouette, square eye cut-out, stub legs.
 * Facing right. '#' = ink, '.' = transparent. 16 columns × 18 rows (48×54 logical px).
 */

const HEAD = [
  '........#######.',
  '........#.######',
  '........#.######',
  '........########',
  '........########',
  '........####....',
  '........######..',
]

/** Wide-eyed, open-mouthed head used for the crash frame. */
const HEAD_CRASHED = [
  '........#######.',
  '........#..#####',
  '........#..#####',
  '........########',
  '........########',
  '........###.....',
  '........######..',
]

const BODY = [
  '#......######...',
  '#.....#########.',
  '##...#######..#.',
  '############....',
  '.##########.....',
  '..#########.....',
  '...#######......',
  '....##..##......',
]

const LEGS_STANDING = ['....##..##......', '....###.###.....']
const LEGS_RUN_A = ['....##...###....', '....###.........']
const LEGS_RUN_B = ['...###..##......', '........###.....']

export const TREX_STANDING: SpriteFrame = defineSprite([...HEAD, ...BODY, ...LEGS_STANDING])
export const TREX_RUN_A: SpriteFrame = defineSprite([...HEAD, ...BODY, ...LEGS_RUN_A])
export const TREX_RUN_B: SpriteFrame = defineSprite([...HEAD, ...BODY, ...LEGS_RUN_B])
export const TREX_CRASHED: SpriteFrame = defineSprite([...HEAD_CRASHED, ...BODY, ...LEGS_STANDING])

/** Ducking: body stretched low, head pushed forward. 22 columns × 10 rows (66×30 px). */
const DUCK_BODY = [
  '............#########.',
  '#...........#.########',
  '##..........##########',
  '###.################..',
  '####################..',
  '.##################...',
  '..################.#..',
  '...##############.....',
]

export const TREX_DUCK_A: SpriteFrame = defineSprite([
  ...DUCK_BODY,
  '....##..##............',
  '....###...............',
])
export const TREX_DUCK_B: SpriteFrame = defineSprite([
  ...DUCK_BODY,
  '....##..##............',
  '........###...........',
])

export const TREX_RUN_FRAMES: readonly SpriteFrame[] = [TREX_RUN_A, TREX_RUN_B]
export const TREX_DUCK_FRAMES: readonly SpriteFrame[] = [TREX_DUCK_A, TREX_DUCK_B]
