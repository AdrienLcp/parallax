import { resolve } from 'node:path'

import { metricTwins } from '@adrienlcp/styles/metric-twins'
import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import fontaine from 'fontaine/postcss'
import { defineConfig } from 'vite'

import { API_PREFIX, SOCKET_PREFIX } from '@parallax/protocol/routes'

import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales.ts'
import { themeStore } from './src/theme.ts'

/** `wrangler dev` of `apps/server`: its `dev.port` in `wrangler.jsonc`. */
const WORKER_DEV_ORIGIN = 'http://localhost:8798'

/**
 * Written per weight in `_fonts.sass`: fontaine sizes every static file of a
 * family from its regular cut, over regular Arial, so a bold line would wrap
 * at another width than the font's.
 */
const FALLBACK_FACES_WRITTEN_BY_HAND = new Set([
  'Barlow Semi Condensed fallback',
  'Big Shoulders Display fallback'
])

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        fontaine({
          fallbacks: ['Arial'],
          resolvePath: (path) => new URL(`./public${path}`, import.meta.url),
          skipFontFaceGeneration: (fallbackName) =>
            FALLBACK_FACES_WRITTEN_BY_HAND.has(fallbackName)
        }),
        metricTwins()
      ]
    }
  },
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
