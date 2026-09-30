/**
 * 8-bit sound effects synthesized with WebAudio oscillators — no audio files.
 * iOS/Telegram webviews only allow audio after a user gesture, so call unlock() from
 * the first pointer/key event.
 */

export type SoundName = 'jump' | 'milestone' | 'crash'

interface ToneSpec {
  readonly frequency: number
  /** Optional pitch slide target (Hz) at the end of the tone. */
  readonly slideTo?: number
  readonly duration: number
  readonly type: OscillatorType
  /** Start offset in seconds relative to "now". */
  readonly delay?: number
}

const PEAK_GAIN = 0.07

const SOUNDS: Readonly<Record<SoundName, readonly ToneSpec[]>> = {
  jump: [{ frequency: 520, slideTo: 980, duration: 0.09, type: 'square' }],
  milestone: [
    { frequency: 880, duration: 0.07, type: 'square' },
    { frequency: 1320, duration: 0.09, type: 'square', delay: 0.08 },
  ],
  crash: [{ frequency: 220, slideTo: 55, duration: 0.28, type: 'sawtooth' }],
}

type AudioContextConstructor = typeof AudioContext

function resolveAudioContext(): AudioContextConstructor | undefined {
  const w = window as Window & { webkitAudioContext?: AudioContextConstructor }
  return window.AudioContext ?? w.webkitAudioContext
}

export class ChiptuneSfx {
  private ctx: AudioContext | undefined

  constructor(private muted = false) {}

  get isMuted(): boolean {
    return this.muted
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  /**
   * Creates/resumes the AudioContext. Must run inside a user-gesture handler; safe to call on
   * every gesture. Resumes from any non-running state, including iOS's 'interrupted' (after a
   * phone call or app switch), not just 'suspended'.
   */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = resolveAudioContext()
        if (!Ctor) return
        this.ctx = new Ctor()
      }
      if (this.ctx.state !== 'running') this.ctx.resume().catch(() => undefined)
    } catch {
      // Audio unsupported or blocked: the game stays fully playable without sound.
      this.ctx = undefined
    }
  }

  play(name: SoundName): void {
    const ctx = this.ctx
    if (this.muted || !ctx || ctx.state !== 'running') return
    for (const tone of SOUNDS[name]) this.playTone(ctx, tone)
  }

  private playTone(ctx: AudioContext, tone: ToneSpec): void {
    const start = ctx.currentTime + (tone.delay ?? 0)
    const end = start + tone.duration
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = tone.type
    oscillator.frequency.setValueAtTime(tone.frequency, start)
    if (tone.slideTo) oscillator.frequency.exponentialRampToValueAtTime(tone.slideTo, end)

    // Short attack + exponential release avoids audible clicks.
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }
}
