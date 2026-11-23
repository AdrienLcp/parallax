/** Every locale the app ships, the reference first. */
export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]
