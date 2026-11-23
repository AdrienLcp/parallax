import { resolve } from 'node:path'

import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales.ts'
import { themeStore } from './src/theme.ts'

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
    port: 5560,
    strictPort: true
  }
})
