/** The browser's languages, most preferred first. */
export const preferredLocales = (): readonly string[] => navigator.languages

/**
 * The browser sends Global Privacy Control: the visitor refused measurement
 * once, for every site. Not in TypeScript's DOM types yet.
 */
export const sendsGlobalPrivacyControl = (): boolean =>
  'globalPrivacyControl' in navigator && navigator.globalPrivacyControl === true
