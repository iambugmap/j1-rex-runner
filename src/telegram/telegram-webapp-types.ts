/**
 * Hand-written types for the subset of the Telegram Mini App SDK (window.Telegram.WebApp)
 * this game uses. See https://core.telegram.org/bots/webapps
 */

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

/** Callback-style key/value storage synced per user across devices (Bot API 6.9+). */
export interface TelegramCloudStorage {
  getItem(key: string, callback: (error: string | null, value?: string) => void): void
  setItem(key: string, value: string, callback?: (error: string | null, stored?: boolean) => void): void
}

export interface TelegramWebApp {
  readonly initData: string
  readonly platform: string
  readonly version: string
  readonly HapticFeedback: TelegramHapticFeedback
  readonly CloudStorage: TelegramCloudStorage
  ready(): void
  expand(): void
  isVersionAtLeast(version: string): boolean
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  /** Bot API 7.7+: stops vertical swipes from minimizing/closing the Mini App. */
  disableVerticalSwipes?(): void
  onEvent(eventType: string, handler: () => void): void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}
