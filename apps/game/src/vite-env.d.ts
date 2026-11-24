/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    /** The short commit the build was made from, empty when it was not known. */
    readonly VITE_APP_COMMIT: string
    readonly VITE_APP_VERSION: string
  }
}

/**
 * The `style` prop only ever hands a runtime value to the stylesheet, through a
 * custom property. React's `CSSProperties` has no room for arbitrary names, and
 * widening it here is what keeps the alternative from being a cast.
 */
declare module 'react' {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined
  }
}

export {}
