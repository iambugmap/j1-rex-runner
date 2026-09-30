/**
 * Pure (DOM-free) sprite model. A sprite is a matrix of characters where '#' is an ink cell
 * and any other character is transparent. Each cell is drawn as a `pixel`×`pixel` block of
 * logical pixels, which gives the chunky, flat pixel-art look.
 *
 * Hitboxes are derived automatically from the ink cells so art and collision never drift apart.
 */

export interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface SpriteFrame {
  readonly rows: readonly string[]
  /** Logical pixels per matrix cell. */
  readonly pixel: number
  /** Size in logical pixels. */
  readonly width: number
  readonly height: number
  /** Collision rectangles in logical pixels, relative to the sprite's top-left corner. */
  readonly hitboxes: readonly Rect[]
}

export const INK = '#'

/** Default cell size for game sprites (chunky blocks). */
export const DEFAULT_SPRITE_PIXEL = 3

/** Returns [startColumn, length] for every contiguous run of ink cells in a row. */
export function inkRuns(row: string): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  let start = -1
  for (let x = 0; x <= row.length; x++) {
    const isInk = row[x] === INK
    if (isInk && start < 0) start = x
    if (!isInk && start >= 0) {
      runs.push([start, x - start])
      start = -1
    }
  }
  return runs
}

/**
 * Builds hitboxes (in cell units) by taking the ink runs of each row and merging runs that
 * repeat with identical columns on consecutive rows into taller rectangles.
 */
export function computeHitboxCells(rows: readonly string[]): Rect[] {
  const finished: Rect[] = []
  let open = new Map<string, Rect>()

  rows.forEach((row, y) => {
    const next = new Map<string, Rect>()
    for (const [x, w] of inkRuns(row)) {
      const key = `${x}:${w}`
      const previous = open.get(key)
      if (previous) {
        next.set(key, { ...previous, h: previous.h + 1 })
        open.delete(key)
      } else {
        next.set(key, { x, y, w, h: 1 })
      }
    }
    finished.push(...open.values())
    open = next
  })

  finished.push(...open.values())
  return finished
}

export function defineSprite(rows: readonly string[], pixel = DEFAULT_SPRITE_PIXEL): SpriteFrame {
  if (rows.length === 0) throw new Error('Sprite must have at least one row')
  const columns = Math.max(...rows.map((row) => row.length))
  const hitboxes = computeHitboxCells(rows).map((cell) => ({
    x: cell.x * pixel,
    y: cell.y * pixel,
    w: cell.w * pixel,
    h: cell.h * pixel,
  }))

  return Object.freeze({
    rows: Object.freeze([...rows]),
    pixel,
    width: columns * pixel,
    height: rows.length * pixel,
    hitboxes: Object.freeze(hitboxes),
  })
}
