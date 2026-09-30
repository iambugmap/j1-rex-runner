/**
 * Renders the 640×360 J1 Rex cover image (BotFather /newapp photo size) from the game's own
 * sprite matrices, so the artwork always matches the game. No image libraries: pixels go into
 * an RGB buffer that is encoded as PNG with Node's built-in zlib.
 *
 * Usage: npm run cover   →   branding/j1-rex-cover-640x360.png
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { deflateSync } from 'node:zlib'
import { createServer } from 'vite'

const WIDTH = 640
const HEIGHT = 360
const GROUND_Y = 300
const OUTPUT = resolve('branding/j1-rex-cover-640x360.png')

// ---- load sprites straight from the game's TypeScript sources via Vite ----
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const load = (path) => vite.ssrLoadModule(path)
const [trex, cactus, ptero, scenery, font, palette] = await Promise.all([
  load('/src/sprites/trex-sprite-frames.ts'),
  load('/src/sprites/cactus-sprite-variants.ts'),
  load('/src/sprites/pterodactyl-sprite-frames.ts'),
  load('/src/sprites/background-scenery-sprites.ts'),
  load('/src/sprites/pixel-font-glyphs.ts'),
  load('/src/game/palette-colors.ts'),
])
await vite.close()

const { DAY_PALETTE } = palette
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const PAPER = hexToRgb(DAY_PALETTE.paper)
const INK = hexToRgb(DAY_PALETTE.ink)
const FAINT = hexToRgb(DAY_PALETTE.faint)

// ---- tiny raster helpers ----
const pixels = new Uint8Array(WIDTH * HEIGHT * 3)

function fillRect(x, y, w, h, [r, g, b]) {
  for (let py = Math.max(0, y); py < Math.min(HEIGHT, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(WIDTH, x + w); px++) {
      const i = (py * WIDTH + px) * 3
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
    }
  }
}

/** Draws a '#' matrix with each cell as a `cell`×`cell` block; (x, bottom) = bottom-left anchor. */
function drawRows(rows, x, bottom, cell, color) {
  const top = bottom - rows.length * cell
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      if (row[rx] === '#') fillRect(x + rx * cell, top + ry * cell, cell, cell, color)
    }
  })
}

function drawText(text, centerX, top, cell, color) {
  const advance = font.GLYPH_ADVANCE * cell
  const width = text.length * advance - cell
  let x = Math.round(centerX - width / 2)
  for (const char of text) {
    const glyph = font.PIXEL_FONT[char]
    if (glyph) drawRows(glyph, x, top + glyph.length * cell, cell, color)
    x += advance
  }
}

// ---- compose the scene ----
fillRect(0, 0, WIDTH, HEIGHT, PAPER)

// Background: faint mountains along the horizon and a few clouds.
for (const mx of [-30, 170, 380, 560]) drawRows(scenery.MOUNTAIN.rows, mx, GROUND_Y, 5, FAINT)
drawRows(scenery.CLOUD.rows, 40, 150, 5, FAINT)
drawRows(scenery.CLOUD.rows, 470, 220, 4, FAINT)
drawRows(scenery.CLOUD.rows, 545, 120, 3, FAINT)

// Title.
drawText('J1 REX', WIDTH / 2, 28, 12, INK)

// Ground line + pebbles.
fillRect(0, GROUND_Y, WIDTH, 5, INK)
const pebbles = [[22, 314, 6], [96, 326, 4], [181, 318, 8], [260, 334, 4], [318, 314, 6], [402, 328, 8], [477, 318, 4], [548, 332, 6], [611, 316, 4]]
for (const [px, py, size] of pebbles) fillRect(px, py, size + 2, size, INK)

// Action: T-rex mid-jump clearing a cactus, pterodactyl incoming, small cactus group ahead.
drawRows(cactus.CACTUS_LARGE.rows, 262, GROUND_Y, 5, INK)
drawRows(trex.TREX_STANDING.rows, 170, 205, 5, INK)
drawRows(ptero.PTERO_WINGS_UP.rows, 430, 175, 5, INK)
drawRows(cactus.CACTUS_SMALL.rows, 520, GROUND_Y, 5, INK)
drawRows(cactus.CACTUS_SMALL.rows, 550, GROUND_Y, 5, INK)

// ---- PNG encoding (8-bit RGB, filter 0 per scanline) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buffer) => {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

const header = Buffer.alloc(13)
header.writeUInt32BE(WIDTH, 0)
header.writeUInt32BE(HEIGHT, 4)
header.set([8, 2, 0, 0, 0], 8) // bit depth 8, color type RGB, default compression/filter, no interlace

const raw = Buffer.alloc(HEIGHT * (WIDTH * 3 + 1))
for (let y = 0; y < HEIGHT; y++) {
  raw[y * (WIDTH * 3 + 1)] = 0
  raw.set(pixels.subarray(y * WIDTH * 3, (y + 1) * WIDTH * 3), y * (WIDTH * 3 + 1) + 1)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, png)
process.stdout.write(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT}, ${png.length} bytes)\n`)
