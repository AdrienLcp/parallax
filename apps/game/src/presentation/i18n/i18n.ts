import { createI18n } from '@adrienlcp/i18n'

import { EN_DICTIONARY } from './dictionary-en'

export const i18n = createI18n({
  defaultLocale: 'en',
  dictionaries: {
    en: EN_DICTIONARY,
    fr: () => import('./dictionary-fr')
  }
})
