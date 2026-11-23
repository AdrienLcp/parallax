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
