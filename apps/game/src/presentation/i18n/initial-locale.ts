import { preferredLocales } from '@/infrastructure/browser'

import { i18n } from './i18n'
import type { Locale } from './locale'

/**
 * The locale the app opens in, negotiated over the browser's languages, and
 * stamped on `<html lang>` so the browser does not offer to translate French
 * text it believes is English. An app with a language switcher reads the
 * stored choice first.
 */
export const applyInitialLocale = (): Locale => {
  const locale = i18n.negotiate(preferredLocales())

  document.documentElement.lang = locale

  return locale
}
