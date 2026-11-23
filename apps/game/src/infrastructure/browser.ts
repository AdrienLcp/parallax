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

const isTransparent = (colour: string): boolean =>
  colour === 'transparent' || /^rgba\(.*,\s*0\)$/.test(colour)

const backdropColour = (element: Element): string | null => {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const colour = getComputedStyle(node).backgroundColor

    if (!isTransparent(colour)) {
      return colour
    }
  }

  return null
}

/** `theme-color` takes sRGB only on some browsers: a pixel drawn in the colour reads it back as hex. */
const toSrgbHex = (colour: string): string | null => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')

  if (context === null) {
    return null
  }

  context.fillStyle = colour
  context.fillRect(0, 0, 1, 1)
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data

  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Turns every `theme-color` tag to the colour painted behind `element`, and
 * returns what puts the tags back as they were. Shaped as a React ref
 * callback: `ref={paintBrowserBarBehind}`.
 */
export const paintBrowserBarBehind = (
  element: Element | null
): (() => void) | undefined => {
  if (element === null) {
    return
  }

  const backdrop = backdropColour(element)
  const hex = backdrop === null ? null : toSrgbHex(backdrop)

  if (hex === null) {
    return () => {}
  }

  const tags = [
    ...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
  ]
  const previous = tags.map((tag) => tag.content)

  for (const tag of tags) {
    tag.content = hex
  }

  return () => {
    tags.forEach((tag, index) => {
      tag.content = previous[index] ?? tag.content
    })
  }
}

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
