import type { TelegramCloudStorage, TelegramWebApp } from './telegram-webapp-types'

/**
 * Thin adapter over the Telegram Mini App SDK. Outside Telegram (plain browser, local dev)
 * every method is a safe no-op, so the game code never needs to branch on the platform.
 */

export type HapticKind = 'crash' | 'record' | 'milestone'

export interface TelegramBridge {
  readonly isTelegram: boolean
  /** Present only when running inside Telegram with CloudStorage support. */
  readonly cloudStorage: TelegramCloudStorage | undefined
  /** Expand to full height, lock vertical swipes and match the header color. */
  init(backgroundColor: string): void
  /** Tells Telegram the app is ready (hides the loading placeholder). */
  ready(): void
  haptic(kind: HapticKind): void
  /** Fires false when the Mini App is minimized/backgrounded, true when it returns. */
  onActiveChange(listener: (active: boolean) => void): void
}

function detectWebApp(): TelegramWebApp | undefined {
  const webApp = window.Telegram?.WebApp
  // The SDK script defines WebApp everywhere; platform is 'unknown' outside Telegram.
  return webApp && webApp.platform !== 'unknown' ? webApp : undefined
}

/** Runs an SDK call, ignoring failures from old clients that lack the method. */
function safely(action: () => void): void {
  try {
    action()
  } catch {
    // Older Telegram clients may throw on unsupported methods; the game works without them.
  }
}

export function createTelegramBridge(): TelegramBridge {
  const webApp = detectWebApp()
  const supports = (version: string): boolean => !!webApp && webApp.isVersionAtLeast(version)

  return {
    isTelegram: !!webApp,
    cloudStorage: webApp && supports('6.9') ? webApp.CloudStorage : undefined,

    init(backgroundColor) {
      if (!webApp) return
      safely(() => webApp.expand())
      if (supports('7.7')) safely(() => webApp.disableVerticalSwipes?.())
      // Hex (#RRGGBB) header/background colors require Bot API 6.9.
      if (supports('6.9')) {
        safely(() => webApp.setHeaderColor(backgroundColor))
        safely(() => webApp.setBackgroundColor(backgroundColor))
      }
    },

    ready() {
      if (webApp) safely(() => webApp.ready())
    },

    haptic(kind) {
      if (!webApp || !supports('6.1')) return
      const haptics = webApp.HapticFeedback
      safely(() => {
        if (kind === 'crash') haptics.impactOccurred('heavy')
        else if (kind === 'record') haptics.notificationOccurred('success')
        else haptics.selectionChanged()
      })
    },

    onActiveChange(listener) {
      if (!webApp || !supports('8.0')) return
      safely(() => {
        webApp.onEvent('activated', () => listener(true))
        webApp.onEvent('deactivated', () => listener(false))
      })
    },
  }
}
