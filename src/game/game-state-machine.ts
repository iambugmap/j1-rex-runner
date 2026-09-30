import { CRASH_RESTART_COOLDOWN_STEPS, RESUME_COUNTDOWN_STEPS, SPEED } from '../config/game-balance-constants'
import type { RandomFn } from '../engine/seeded-random'
import { DayNightCycle } from './day-night-cycle'
import { DistanceScoreTracker } from './distance-score-tracker'
import { ObstacleSpawner } from './obstacle-spawner'
import { ParallaxScenery } from './parallax-scenery-layers'
import { TrexPlayer } from './trex-player-physics'

/**
 * Game session state machine: READY → RUNNING → PAUSED → RESUMING (countdown) → RUNNING,
 * RUNNING → CRASHED → RUNNING.
 * Pure logic (no DOM) — input calls press/release methods, the loop calls step() at 60Hz,
 * and side effects (sound, haptics, storage) subscribe through onEvent().
 */

export type GamePhase = 'ready' | 'running' | 'paused' | 'resuming' | 'crashed'
export type GameEvent = 'start' | 'jump' | 'milestone' | 'crash' | 'record'
export type GameEventListener = (event: GameEvent) => void

export class GameSession {
  readonly player = new TrexPlayer()
  readonly obstacles: ObstacleSpawner
  readonly scenery: ParallaxScenery
  readonly score = new DistanceScoreTracker()
  readonly dayNight = new DayNightCycle()

  private currentPhase: GamePhase = 'ready'
  private currentSpeed: number = SPEED.start
  private stepsInPhase = 0
  private listeners: GameEventListener[] = []

  constructor(rng: RandomFn) {
    this.obstacles = new ObstacleSpawner(rng)
    this.scenery = new ParallaxScenery(rng)
  }

  get phase(): GamePhase {
    return this.currentPhase
  }

  get speed(): number {
    return this.currentSpeed
  }

  /** Steps spent in the current phase (drives restart cooldown and overlay blinking). */
  get phaseSteps(): number {
    return this.stepsInPhase
  }

  /** Countdown digit (3, 2, 1) while resuming; 0 otherwise. */
  get resumeCountdown(): number {
    if (this.currentPhase !== 'resuming') return 0
    const remaining = RESUME_COUNTDOWN_STEPS - this.stepsInPhase
    return Math.max(1, Math.ceil((remaining * 3) / RESUME_COUNTDOWN_STEPS))
  }

  get canRestart(): boolean {
    return this.currentPhase === 'crashed' && this.stepsInPhase >= CRASH_RESTART_COOLDOWN_STEPS
  }

  /** Subscribe to gameplay events; returns an unsubscribe function. */
  onEvent(listener: GameEventListener): () => void {
    this.listeners = [...this.listeners, listener]
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  setHighScore(value: number): void {
    this.score.setHighScore(value)
  }

  /** Jump is also the universal "start / resume / restart" action. */
  pressJump(): void {
    switch (this.currentPhase) {
      case 'ready':
        this.beginRun()
        this.jump()
        break
      case 'running':
        this.jump()
        break
      case 'paused':
        this.setPhase('resuming')
        break
      case 'resuming':
        break
      case 'crashed':
        if (this.canRestart) this.restart()
        break
    }
  }

  releaseJump(): void {
    this.player.releaseJump()
  }

  pressDuck(): void {
    if (this.currentPhase === 'running') this.player.pressDuck()
  }

  releaseDuck(): void {
    this.player.releaseDuck()
  }

  pause(): void {
    if (this.currentPhase === 'running' || this.currentPhase === 'resuming') this.setPhase('paused')
  }

  /** Advances the simulation by one fixed step. */
  step(): void {
    this.stepsInPhase++
    this.dayNight.update(this.score.score)
    if (this.currentPhase === 'resuming' && this.stepsInPhase >= RESUME_COUNTDOWN_STEPS) this.setPhase('running')
    if (this.currentPhase !== 'running') return

    this.currentSpeed = Math.min(SPEED.max, this.currentSpeed + SPEED.acceleration)
    this.player.step()
    this.obstacles.update(this.currentSpeed, this.score.score)
    this.scenery.update(this.currentSpeed)
    if (this.score.advance(this.currentSpeed)) this.emit('milestone')

    if (this.obstacles.collidesWith(this.player.bounds(), this.player.hitboxes())) this.crash()
  }

  private jump(): void {
    if (this.player.pressJump()) this.emit('jump')
  }

  private beginRun(): void {
    this.player.startRunning()
    this.setPhase('running')
    this.emit('start')
  }

  private restart(): void {
    this.player.reset()
    this.obstacles.reset()
    this.score.reset()
    this.dayNight.reset()
    this.currentSpeed = SPEED.start
    this.beginRun()
  }

  private crash(): void {
    this.player.crash()
    this.setPhase('crashed')
    this.emit('crash')
    if (this.score.commitHighScore()) this.emit('record')
  }

  private setPhase(phase: GamePhase): void {
    this.currentPhase = phase
    this.stepsInPhase = 0
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(event)
  }
}
