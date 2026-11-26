import { useLayoutEffect, useState } from 'react'

import { resolveCssColor } from '@/infrastructure/css-color'

import { hexOf, relativeLuminanceOf, toneOfBackdrop } from './display-tuning'

/**
 * Tells the root how light the backdrop `color` paints (`data-backdrop-tone`),
 * so the lettering standing on it turns dark on a light one, for as long as
 * the page is shown. The game's own backdrop changes with the game the page
 * shows, so the tone is read again whenever a `data-game` changes. Returns the
 * backdrop as `#rrggbb`.
 */
export const useBackdropTone = (color: string): string => {
  const [backdropHex, setBackdropHex] = useState('#000000')

  useLayoutEffect(() => {
    const root = document.documentElement
    let shownHex: string | null = null
    const readBackdrop = () => {
      // Probed under the root, outside the watched body: a probe in it would wake the watch again.
      const resolved = resolveCssColor(color, root)
      const hex = hexOf(resolved)
      if (hex === shownHex) return
      shownHex = hex
      root.dataset.backdropTone = toneOfBackdrop(relativeLuminanceOf(resolved))
      setBackdropHex(hex)
    }
    readBackdrop()
    const games = new MutationObserver(readBackdrop)
    games.observe(document.body, {
      attributeFilter: ['data-game'],
      attributes: true,
      childList: true,
      subtree: true
    })

    return () => {
      games.disconnect()
      delete root.dataset.backdropTone
    }
  }, [color])

  return backdropHex
}
