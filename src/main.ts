import './styles.css'
import { ChiptuneSfx } from './audio/webaudio-chiptune-sfx'
import { fitCanvasToContainer } from './engine/canvas-viewport-scaler'
import { createGameLoop } from './engine/fixed-timestep-game-loop'
import { attachInput } from './engine/input-controller-keyboard-touch'
import { createSeededRandom } from './engine/seeded-random'
import { renderScene } from './game/game-scene-renderer'
import { GameSession } from './game/game-state-machine'
import { DAY_PALETTE } from './game/palette-colors'
import { HighScoreStore } from './storage/high-score-storage'
import { readLocal, writeLocal } from './storage/safe-local-storage'
import { createTelegramBridge } from './telegram/telegram-webapp-bridge'

/** Composition root: wires DOM, input, loop, audio, storage and Telegram around GameSession. */

const MUTED_KEY = 'j1rex_muted'

function requireElement<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const element = document.getElementById(id)
  if (!(element instanceof type)) throw new Error(`Missing #${id} element`)
  return element
}

function setupSoundToggle(button: HTMLButtonElement, sfx: ChiptuneSfx): void {
  const sync = (): void => {
    button.textContent = sfx.isMuted ? 'SOUND OFF' : 'SOUND ON'
    // aria-label "Mute sound" + aria-pressed=true reads correctly as "muted".
    button.setAttribute('aria-pressed', String(sfx.isMuted))
  }
  button.addEventListener('click', () => {
    sfx.setMuted(!sfx.isMuted)
    writeLocal(MUTED_KEY, sfx.isMuted ? '1' : '0')
    sync()
    button.blur() // keep Space/Enter for the game, not for re-toggling the button
  })
  sync()
}

function setupControlsHint(hint: HTMLElement, duckButton: HTMLButtonElement): void {
  // any-pointer also catches hybrid devices (touch laptops, tablets with a trackpad).
  const isTouch = window.matchMedia('(any-pointer: coarse)').matches
  duckButton.hidden = !isTouch
  hint.textContent = isTouch ? 'TAP to jump · hold DUCK to duck' : 'SPACE / ↑ to jump · ↓ to duck'
}

function main(): void {
  const canvas = requireElement('game', HTMLCanvasElement)
  const stage = requireElement('stage', HTMLDivElement)
  const muteButton = requireElement('mute-btn', HTMLButtonElement)
  const duckButton = requireElement('duck-btn', HTMLButtonElement)
  const hint = requireElement('hint', HTMLParagraphElement)
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('2D canvas context unavailable')

  const telegram = createTelegramBridge()
  telegram.init(DAY_PALETTE.paper)

  const sfx = new ChiptuneSfx(readLocal(MUTED_KEY) === '1')
  const session = new GameSession(createSeededRandom(Date.now()))
  const highScores = new HighScoreStore(telegram.cloudStorage)

  // Side effects react to gameplay events; GameSession itself stays pure.
  session.onEvent((event) => {
    switch (event) {
      case 'jump':
        sfx.play('jump')
        break
      case 'milestone':
        sfx.play('milestone')
        telegram.haptic('milestone')
        break
      case 'crash':
        sfx.play('crash')
        telegram.haptic('crash')
        break
      case 'record':
        telegram.haptic('record')
        void highScores.save(session.score.highScore)
        break
      case 'start':
        break
    }
  })

  // Local value shows instantly; the cloud value (other devices) merges in when it arrives.
  session.setHighScore(highScores.loadLocal())
  void highScores.loadCloud().then((score) => {
    if (score !== undefined) session.setHighScore(score)
  })

  let scale = fitCanvasToContainer(canvas, stage)
  window.addEventListener('resize', () => {
    scale = fitCanvasToContainer(canvas, stage)
  })

  // Audio may only start inside a user gesture (iOS / Telegram webviews). iOS counts touchend /
  // pointerup (not pointerdown) as the activating gesture, so listen to all of them.
  const unlockAudio = (): void => sfx.unlock()
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'keydown']) {
    window.addEventListener(type, unlockAudio, { capture: true, passive: true })
  }

  attachInput(
    {
      onJumpStart: () => session.pressJump(),
      onJumpEnd: () => session.releaseJump(),
      onDuckStart: () => session.pressDuck(),
      onDuckEnd: () => session.releaseDuck(),
    },
    duckButton,
  )

  setupSoundToggle(muteButton, sfx)
  setupControlsHint(hint, duckButton)

  // Never keep running while the player can't see the game.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) session.pause()
  })
  telegram.onActiveChange((active) => {
    if (active) return
    session.releaseJump()
    session.releaseDuck()
    session.pause()
  })

  const render = (): void => renderScene(ctx, scale, session)
  createGameLoop(() => session.step(), render).start()
  telegram.ready()

  // Dev-only debugging hook (stripped from production builds).
  if (import.meta.env.DEV) {
    Object.assign(window, { __j1rex: { session, render } })
  }
}

main()
