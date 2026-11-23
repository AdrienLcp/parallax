import { createThemePreferenceStore } from '@adrienlcp/theme-preference'

/** Where the theme the user picked is remembered, named on the legal page. */
export const THEME_STORAGE_KEY = 'app:theme'

export const themeStore = createThemePreferenceStore({
  storageKey: THEME_STORAGE_KEY
})
