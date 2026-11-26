import { resolve } from 'node:path'

import { defineConfig, type Plugin } from 'vitest/config'

const RAPIER_WASM_IMPORT = 'import * as wasm from "./rapier_wasm3d_bg.wasm";'

/**
 * Rapier's physics is a `.wasm` module the app's bundler imports
 * (`vite-plugin-wasm`); its helper cannot run under Vitest. In tests the
 * module is read from disk and instantiated against its JavaScript glue.
 */
const rapierWasmInTests = (): Plugin => ({
  name: 'rapier-wasm-in-tests',
  transform: (code, id) => {
    if (!id.replaceAll('\\', '/').endsWith('/rapier3d/rapier_wasm3d.js')) {
      return null
    }
    const wasmPath = JSON.stringify(resolve(id, '..', 'rapier_wasm3d_bg.wasm'))
    return code.replace(
      RAPIER_WASM_IMPORT,
      [
        'import { readFileSync } from "node:fs";',
        'import * as glue from "./rapier_wasm3d_bg.js";',
        `const wasm = new WebAssembly.Instance(new WebAssembly.Module(readFileSync(${wasmPath})), { "./rapier_wasm3d_bg.js": glue }).exports;`
      ].join('\n')
    )
  }
})

export default defineConfig({
  plugins: [rapierWasmInTests()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      // Rapier names only a `module` entry, which Vitest does not resolve.
      '@dimforge/rapier3d': resolve(
        import.meta.dirname,
        './node_modules/@dimforge/rapier3d/rapier.js'
      )
    }
  },
  test: {
    include: ['scripts/**/*.test.ts', 'src/**/*.test.ts'],
    server: { deps: { inline: [/@dimforge[\\/]rapier3d/] } }
  }
})
