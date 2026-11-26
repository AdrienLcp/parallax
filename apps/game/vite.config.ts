import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { metricTwins } from '@adrienlcp/styles/metric-twins'
import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import fontaine from 'fontaine/postcss'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

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

/** The commit a build is made from: CI's, or the checkout's; empty when neither is known. */
const buildCommit = (): string => {
  if (process.env.GITHUB_SHA !== undefined) {
    return process.env.GITHUB_SHA.slice(0, 7)
  }
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8'
    }).trim()
  } catch {
    return ''
  }
}

const appVersion: string = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../package.json'), 'utf8')
).version

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        // three in a chunk of its own: only the games' scenes load it.
        codeSplitting: {
          groups: [{ name: 'three', test: /[\\/]node_modules[\\/]three[\\/]/ }]
        }
      }
    }
  },
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
  define: {
    'import.meta.env.VITE_APP_COMMIT': JSON.stringify(buildCommit()),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion)
  },
  plugins: [
    react({ compiler: { reportDiagnostics: true } }),
    {
      ...optimizeLocales.vite({ locales: Object.values(REGIONAL_LOCALES) }),
      enforce: 'pre'
    },
    themePreferencePlugin(themeStore),
    // Rapier's physics ships as a `.wasm` file imported as a module.
    wasm()
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
