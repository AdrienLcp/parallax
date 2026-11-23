import { resolve } from 'node:path'

import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { API_PREFIX, SOCKET_PREFIX } from '@parallax/protocol/routes'

import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales.ts'
import { themeStore } from './src/theme.ts'

/** `wrangler dev` of `apps/server`: its `dev.port` in `wrangler.jsonc`. */
const WORKER_DEV_ORIGIN = 'http://localhost:8798'

export default defineConfig({
  plugins: [
    react({ compiler: { reportDiagnostics: true } }),
    {
      ...optimizeLocales.vite({ locales: Object.values(REGIONAL_LOCALES) }),
      enforce: 'pre'
    },
    themePreferencePlugin(themeStore)
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src')
    }
  },
  server: {
    host: true,
    port: 5560,
    proxy: {
      [API_PREFIX]: WORKER_DEV_ORIGIN,
      [SOCKET_PREFIX]: { target: WORKER_DEV_ORIGIN, ws: true }
    },
    strictPort: true
  }
})
