/** Navy-on-cream palette; night mode inverts ink and paper. */

export interface Palette {
  readonly paper: string
  readonly ink: string
  /** Low-contrast color for background scenery (clouds, mountains). */
  readonly faint: string
}

export const DAY_PALETTE: Palette = Object.freeze({
  paper: '#F5EFE0',
  ink: '#1F2A44',
  faint: '#D9D1BD',
})

export const NIGHT_PALETTE: Palette = Object.freeze({
  paper: '#1F2A44',
  ink: '#F5EFE0',
  faint: '#3A4766',
})

function parseHex(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`Invalid hex color: ${hex}`)
  const value = parseInt(match[1], 16)
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

/** Linear blend between two #RRGGBB colors; t is clamped to [0, 1]. */
export function mixHex(from: string, to: string, t: number): string {
  const amount = Math.min(1, Math.max(0, t))
  const a = parseHex(from)
  const b = parseHex(to)
  const mixed = a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount))
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
