import { describe, expect, it } from 'vitest'
import { CLOUD, MOUNTAIN, RESTART_ICON } from '../sprites/background-scenery-sprites'
import { CACTUS_LARGE, CACTUS_SMALL } from '../sprites/cactus-sprite-variants'
import { GLYPH_COLUMNS, GLYPH_ROWS, PIXEL_FONT } from '../sprites/pixel-font-glyphs'
import { PTERO_FRAMES } from '../sprites/pterodactyl-sprite-frames'
import * as trex from '../sprites/trex-sprite-frames'
import { computeHitboxCells, defineSprite, inkRuns, type Rect, type SpriteFrame } from './sprite-frame-definition'

const ALL_SPRITES: Record<string, SpriteFrame> = {
  TREX_STANDING: trex.TREX_STANDING,
  TREX_RUN_A: trex.TREX_RUN_A,
  TREX_RUN_B: trex.TREX_RUN_B,
  TREX_CRASHED: trex.TREX_CRASHED,
  TREX_DUCK_A: trex.TREX_DUCK_A,
  TREX_DUCK_B: trex.TREX_DUCK_B,
  CACTUS_SMALL,
  CACTUS_LARGE,
  PTERO_UP: PTERO_FRAMES[0],
  PTERO_DOWN: PTERO_FRAMES[1],
  CLOUD,
  MOUNTAIN,
  RESTART_ICON,
}

const inkCellCount = (rows: readonly string[]): number =>
  rows.reduce((sum, row) => sum + [...row].filter((c) => c === '#').length, 0)

describe('inkRuns', () => {
  it('finds contiguous ink runs including one touching the row end', () => {
    expect(inkRuns('##..#.###')).toEqual([
      [0, 2],
      [4, 1],
      [6, 3],
    ])
  })

  it('returns nothing for an empty row', () => {
    expect(inkRuns('....')).toEqual([])
  })
})

describe('computeHitboxCells', () => {
  it('merges identical runs on consecutive rows', () => {
    expect(computeHitboxCells(['.##.', '.##.', '####'])).toEqual([
      { x: 1, y: 0, w: 2, h: 2 },
      { x: 0, y: 2, w: 4, h: 1 },
    ])
  })

  it('does not merge runs separated by an empty row', () => {
    expect(computeHitboxCells(['#', '.', '#'])).toEqual([
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 0, y: 2, w: 1, h: 1 },
    ])
  })
})

describe('defineSprite', () => {
  it('rejects an empty sprite', () => {
    expect(() => defineSprite([])).toThrow()
  })

  it('scales size and hitboxes by the pixel size', () => {
    const frame = defineSprite(['##', '#.'], 3)
    expect(frame.width).toBe(6)
    expect(frame.height).toBe(6)
    expect(frame.hitboxes).toContainEqual({ x: 0, y: 0, w: 6, h: 3 })
  })

  it('is immutable', () => {
    const frame = defineSprite(['#'])
    expect(Object.isFrozen(frame)).toBe(true)
    expect(Object.isFrozen(frame.hitboxes)).toBe(true)
  })
})

describe('game sprites integrity', () => {
  it.each(Object.entries(ALL_SPRITES))('%s has rows of equal width', (_, frame) => {
    const widths = new Set(frame.rows.map((row) => row.length))
    expect(widths.size).toBe(1)
  })

  it.each(Object.entries(ALL_SPRITES))('%s hitboxes stay inside bounds and cover every ink cell', (_, frame) => {
    const within = (r: Rect): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= frame.width && r.y + r.h <= frame.height
    expect(frame.hitboxes.every(within)).toBe(true)
    const coveredCells = frame.hitboxes.reduce((sum, r) => sum + (r.w * r.h) / frame.pixel ** 2, 0)
    expect(coveredCells).toBe(inkCellCount(frame.rows))
  })

  it('ducking T-rex is shorter than standing (needed to pass under mid pterodactyls)', () => {
    expect(trex.TREX_DUCK_A.height).toBeLessThan(trex.TREX_STANDING.height)
  })
})

describe('pixel font', () => {
  it.each(Object.entries(PIXEL_FONT))('glyph %s is 3×5', (_, rows) => {
    expect(rows).toHaveLength(GLYPH_ROWS)
    expect(rows.every((row) => row.length === GLYPH_COLUMNS)).toBe(true)
  })

  it('covers every character used by the HUD and overlays', () => {
    const used = new Set('0123456789 HI TAP TO START GAME OVER PAUSED RESUME'.replace(/ /g, ''))
    for (const char of used) expect(PIXEL_FONT[char], char).toBeDefined()
  })
})
