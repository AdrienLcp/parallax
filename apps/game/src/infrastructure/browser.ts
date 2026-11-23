import { Result } from '@adrienlcp/result'

/** A WebSocket URL on this page's own host: `ws:` in dev, `wss:` behind HTTPS. */
export const sameHostSocketUrl = (path: string): string => {
  const url = new URL(path, location.href)
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.href
}

/** The browser's languages, most preferred first. */
export const preferredLocales = (): readonly string[] => navigator.languages

/**
 * The browser sends Global Privacy Control: the visitor refused measurement
 * once, for every site. Not in TypeScript's DOM types yet.
 */
export const sendsGlobalPrivacyControl = (): boolean =>
  'globalPrivacyControl' in navigator && navigator.globalPrivacyControl === true

/** A path on this page's own origin, made whole: what a QR code or another device needs. */
export const sameOriginUrl = (path: string): string =>
  new URL(path, location.origin).href

/** Starts the page over from the server: a fresh socket, a fresh state. */
export const reloadPage = (): void => location.reload()

/** Whether the main pointer is a finger, as on a phone or a tablet, rather than a mouse. */
export const hasCoarsePointer = (): boolean =>
  matchMedia('(pointer: coarse)').matches

/** Whether the visitor asked their system for less motion. */
export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

/** Buzzes under the thumb, in milliseconds of buzz and pause; silent where the browser cannot (iOS). */
export const vibrate = (pattern: number | readonly number[]): void => {
  if (!('vibrate' in navigator)) {
    return
  }

  navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern])
}

export type LandscapeHoldError = 'refused' | 'unsupported'

/**
 * Takes the whole screen and turns the page to landscape, where the browser
 * lets a page do it (Android). iOS offers neither to a page. Only answers
 * inside a user activation: call it from a `pointerup` or a `click`.
 */
export const holdLandscape = async (): Promise<
  Result<void, LandscapeHoldError>
> => {
  const page = document.documentElement

  if (
    typeof page.requestFullscreen !== 'function' ||
    typeof screen.orientation?.lock !== 'function'
  ) {
    return Result.failure('unsupported')
  }

  try {
    await page.requestFullscreen({ navigationUI: 'hide' })
    await screen.orientation.lock('landscape')
    return Result.success()
  } catch {
    return Result.failure('refused')
  }
}
