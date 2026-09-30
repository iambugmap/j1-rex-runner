import { defineSprite, type SpriteFrame } from '../engine/sprite-frame-definition'

/**
 * Flying dino obstacle, facing left (towards the player). Two wing frames.
 * 14 columns × 10 rows (42×30 logical px). Both frames share the same box so the
 * vertical position stays stable while flapping.
 */

export const PTERO_WINGS_UP: SpriteFrame = defineSprite([
  '......##......',
  '......###.....',
  '......####....',
  '..##..#####...',
  '.#.##########.',
  '##############',
  '...##########.',
  '..............',
  '..............',
  '..............',
])

export const PTERO_WINGS_DOWN: SpriteFrame = defineSprite([
  '..............',
  '..............',
  '..............',
  '..##..........',
  '.#.##########.',
  '##############',
  '...##########.',
  '......####....',
  '......###.....',
  '......##......',
])

export const PTERO_FRAMES: readonly SpriteFrame[] = [PTERO_WINGS_UP, PTERO_WINGS_DOWN]
