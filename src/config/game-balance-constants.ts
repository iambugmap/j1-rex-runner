/**
 * Every tunable gameplay number lives here so difficulty can be balanced in one place.
 * Units: logical pixels and fixed 60Hz simulation steps (see fixed-timestep-game-loop).
 * Values are adapted from Chrome's offline dino game.
 */

/** Logical canvas size; the viewport scaler maps this to device pixels. */
export const WORLD = {
  width: 600,
  height: 150,
  /** Y coordinate where sprite bottoms rest (top of the ground line). */
  groundY: 136,
} as const

export const TREX = {
  x: 40,
  gravity: 0.6,
  /** Initial upward velocity when a jump starts. */
  jumpVelocity: 10,
  /** Upward velocity is capped to this once the jump is released / max height reached. */
  dropVelocity: 5,
  /** Releasing jump before this height still carries the T-rex up to it. */
  minJumpHeight: 30,
  /** Keeps the apex (incl. the drop-velocity carry) inside the 150px-tall canvas. */
  maxJumpHeight: 55,
  /** Gravity multiplier while ducking in mid-air (fast fall). */
  speedDropCoefficient: 3,
  /** Steps between leg animation frames. */
  runFrameSteps: 5,
} as const

export const SPEED = {
  start: 6,
  max: 13,
  acceleration: 0.001,
} as const

export const SCORE = {
  /** score = floor(distance * coefficient) */
  coefficient: 0.025,
  milestone: 100,
  /** Day/night flips every N points. */
  dayNightPeriod: 700,
  /** How long the score blinks after a milestone. */
  flashSteps: 45,
  /** Blend change per step during a day/night transition (~1 second). */
  dayNightFadePerStep: 1 / 60,
} as const

export const OBSTACLE = {
  /** gap = width * speed + minGap * gapCoefficient, randomized up to maxGapCoefficient×. */
  gapCoefficient: 0.6,
  maxGapCoefficient: 1.5,
  /** Never spawn the same obstacle kind more than this many times in a row. */
  maxDuplication: 2,
  /** Quiet period after the run starts before the first obstacle appears. */
  warmupSteps: 60,
  pteroMinScore: 450,
  /** Pterodactyl bottom heights above the ground: jump over / duck under / run under. */
  pteroLifts: [6, 36, 62],
  pteroSpeedOffset: 0.8,
  pteroFlapSteps: 10,
} as const

/** Overlap (px) that must be exceeded on both axes before a hit counts — forgives grazes. */
export const COLLISION_TOLERANCE = 2

/** Steps after a crash before input can restart the run (prevents accidental restarts). */
export const CRASH_RESTART_COOLDOWN_STEPS = 30

/** 3-2-1 countdown after un-pausing, so a frozen obstacle can't cause an instant crash. */
export const RESUME_COUNTDOWN_STEPS = 90
