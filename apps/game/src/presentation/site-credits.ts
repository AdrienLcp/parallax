import type { Locale } from '@/presentation/i18n/locale'

/** The author every page credits in its footer, linked to his site in the reader's language. */
export const AUTHOR = {
  name: 'Adrien Lacourpaille',
  siteHref: {
    en: 'https://adrienlcp.com/en',
    fr: 'https://adrienlcp.com/fr'
  }
} as const satisfies { name: string; siteHref: Record<Locale, string> }

/**
 * The project's public repository, linked from the footer. A project sets its
 * own, or `null` when its source is private: the footer then links none.
 */
export const SOURCE_REPOSITORY_HREF: string | null =
  'https://github.com/AdrienLcp/project-name'
