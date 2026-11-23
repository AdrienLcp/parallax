import type React from 'react'

import { I18nProvider as ReactAriaI18nProvider } from '@/presentation/components/i18n-provider'

import { I18nContext, useI18n } from './i18n-context'
import type { Locale } from './locale'
import { REGIONAL_LOCALES } from './regional-locales'
import type { Translate } from './translation'

export const useTranslate = (): Translate => useI18n().translate

type I18nProviderProps = {
  children: React.ReactNode
  locale: Locale
  /** The translator `main.tsx` loaded for `locale` before the first render. */
  translate: Translate
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  locale,
  translate
}) => (
  <I18nContext value={{ locale, translate }}>
    <ReactAriaI18nProvider locale={REGIONAL_LOCALES[locale]}>
      {children}
    </ReactAriaI18nProvider>
  </I18nContext>
)
