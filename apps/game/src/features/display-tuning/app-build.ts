import type { AppBuild } from './tuning-file'

/** The build this page runs: its version and the commit it was made from. */
export const APP_BUILD: AppBuild = {
  commit: import.meta.env.VITE_APP_COMMIT || null,
  version: import.meta.env.VITE_APP_VERSION
}
